import { Prisma, PrismaClient, Role, TournamentState, RegistrationStatus, MatchResultCode } from "@prisma/client";
import { getDefaultPokemonRuleset } from "@/lib/tournament/rules";
import { buildDemoTournament } from "@/lib/tournament/demo-data";

const prisma = new PrismaClient();

function resolveMappedPlayerId(playerIdMap: Map<string, string>, sourcePlayerId: string) {
  const mappedPlayerId = playerIdMap.get(sourcePlayerId);
  if (!mappedPlayerId) {
    throw new Error(`Missing persisted player mapping for ${sourcePlayerId}.`);
  }

  return mappedPlayerId;
}

async function main() {
  const ruleset = getDefaultPokemonRuleset();
  const tournament = buildDemoTournament();
  const playerIdMap = new Map<string, string>();
  const serializedRulesetSettings = ruleset.settings as unknown as Prisma.InputJsonValue;

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

  const persistedRuleset = await prisma.tournamentRuleset.upsert({
    where: { id: "cardshall-ruleset-2026-1" },
    update: {
      name: ruleset.name,
      version: ruleset.version,
      effectiveDate: new Date(ruleset.effectiveDate),
      game: ruleset.game,
      format: ruleset.format,
      settings: serializedRulesetSettings,
    },
    create: {
      id: "cardshall-ruleset-2026-1",
      organizationId: organization.id,
      name: ruleset.name,
      version: ruleset.version,
      effectiveDate: new Date(ruleset.effectiveDate),
      game: ruleset.game,
      format: ruleset.format,
      settings: serializedRulesetSettings,
    },
  });

  const tournamentRow = await prisma.tournament.upsert({
    where: { slug: tournament.slug },
    update: {
      name: tournament.name,
      format: tournament.format,
      venueId: venue.id,
      rulesetId: persistedRuleset.id,
      state: TournamentState.ROUND_ACTIVE,
      startsAt: new Date(`${tournament.date}T10:00:00.000Z`),
    },
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
    playerIdMap.set(entry.player.id, player.id);

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
      const playerAId = resolveMappedPlayerId(playerIdMap, match.playerAId);
      const playerBId = match.playerBId ? resolveMappedPlayerId(playerIdMap, match.playerBId) : null;

      await prisma.match.upsert({
        where: {
          roundId_tableNumber: {
            roundId: createdRound.id,
            tableNumber: match.tableNumber,
          },
        },
        update: {
          playerAId,
          playerBId,
          resultCode: match.resultCode as MatchResultCode,
          isBye: match.isBye,
        },
        create: {
          id: `${createdRound.id}-${match.tableNumber}`,
          roundId: createdRound.id,
          tableNumber: match.tableNumber,
          playerAId,
          playerBId,
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
