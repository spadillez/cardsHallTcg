import { PrismaClient, Role, TournamentState, RegistrationStatus, MatchResultCode } from "@prisma/client";
import { getDefaultPokemonRuleset } from "@/lib/tournament/rules";
import { buildDemoTournament } from "@/lib/tournament/demo-data";

const prisma = new PrismaClient();

async function main() {
  const ruleset = getDefaultPokemonRuleset();
  const tournament = buildDemoTournament();

  const organization = await prisma.organization.upsert({
    where: { slug: "cardshall" },
    update: {},
    create: { name: "CardsHall", slug: "cardshall" },
  });

  const venue = await prisma.venue.upsert({
    where: { id: "cardshall-demo-venue" },
    update: {},
    create: {
      id: "cardshall-demo-venue",
      organizationId: organization.id,
      name: "CardsHall Arena",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
    },
  });

  await prisma.user.upsert({
    where: { email: "organizer@cardshall.local" },
    update: {},
    create: {
      email: "organizer@cardshall.local",
      name: "Organizer Demo",
      memberships: {
        create: {
          organizationId: organization.id,
          role: Role.ORGANIZER,
        },
      },
    },
  });

  const persistedRuleset = await prisma.tournamentRuleset.create({
    data: {
      organizationId: organization.id,
      name: ruleset.name,
      version: ruleset.version,
      effectiveDate: new Date(ruleset.effectiveDate),
      game: ruleset.game,
      format: ruleset.format,
      settings: ruleset.settings,
    },
  });

  const tournamentRow = await prisma.tournament.upsert({
    where: { slug: tournament.slug },
    update: {},
    create: {
      organizationId: organization.id,
      venueId: venue.id,
      rulesetId: persistedRuleset.id,
      name: tournament.name,
      slug: tournament.slug,
      format: tournament.format,
      state: TournamentState.ROUND_ACTIVE,
      startsAt: new Date(`${tournament.date}T10:00:00.000Z`),
    },
  });

  for (const entry of tournament.players) {
    const player = await prisma.player.upsert({
      where: {
        organizationId_playerId: {
          organizationId: organization.id,
          playerId: entry.player.playerId,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        fullName: entry.player.fullName,
        playerId: entry.player.playerId,
        birthDate: new Date(entry.player.birthDate),
        category: entry.player.category,
        country: entry.player.country,
        state: entry.player.state,
        city: entry.player.city,
        nickname: entry.player.nickname,
      },
    });

    await prisma.tournamentRegistration.upsert({
      where: {
        tournamentId_playerId: {
          tournamentId: tournamentRow.id,
          playerId: player.id,
        },
      },
      update: {},
      create: {
        tournamentId: tournamentRow.id,
        playerId: player.id,
        status: RegistrationStatus.CHECKED_IN,
        hadBye: entry.hadBye,
        fixedTable: entry.fixedTable,
      },
    });
  }

  for (const round of tournament.rounds) {
    const createdRound = await prisma.round.upsert({
      where: { tournamentId_number: { tournamentId: tournamentRow.id, number: round.number } },
      update: {
        status: round.status,
        startedAt: new Date(round.startedAt),
        endsAt: new Date(round.endsAt),
      },
      create: {
        tournamentId: tournamentRow.id,
        number: round.number,
        status: round.status,
        startedAt: new Date(round.startedAt),
        endsAt: new Date(round.endsAt),
      },
    });

    for (const match of round.matches) {
      await prisma.match.upsert({
        where: { id: `${createdRound.id}-${match.tableNumber}` },
        update: {
          resultCode: match.resultCode as MatchResultCode,
          isBye: match.isBye,
        },
        create: {
          id: `${createdRound.id}-${match.tableNumber}`,
          roundId: createdRound.id,
          tableNumber: match.tableNumber,
          playerAId: tournament.players.find((entry) => entry.player.id === match.playerAId)?.player.playerId ?? "",
          playerBId: match.playerBId
            ? tournament.players.find((entry) => entry.player.id === match.playerBId)?.player.playerId
            : null,
          resultCode: match.resultCode as MatchResultCode,
          isBye: match.isBye,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
