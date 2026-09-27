import { createRoundMatches } from "@/lib/tournament/pairings";
import { getDefaultPokemonRuleset, getTournamentStructure } from "@/lib/tournament/rules";
import { buildStandings } from "@/lib/tournament/standings";
import type { MatchResultCode, Organization, Tournament, TournamentPlayer } from "@/lib/tournament/types";

const PLAYER_NAMES = [
  "João Silva",
  "Marcos Oliveira",
  "Ana Costa",
  "Lucas Lima",
  "Carla Dias",
  "Pedro Santos",
  "Beatriz Rocha",
  "Rafael Almeida",
  "Juliana Moura",
  "Thiago Souza",
  "Camila Fernandes",
  "Bruno Castro",
  "Larissa Teixeira",
  "Mateus Carvalho",
  "Fernanda Ribeiro",
  "Gabriel Nunes",
  "Paula Martins",
  "Diego Gomes",
  "Amanda Lopes",
  "Renato Moreira",
  "Natália Ferreira",
  "Vinícius Barbosa",
  "Priscila Azevedo",
  "Felipe Cardoso",
  "Isabela Melo",
  "Henrique Pires",
  "Talita Vieira",
  "Caio Batista",
  "Débora Reis",
  "Igor Freitas",
  "Patrícia Cunha",
  "Leonardo Tavares",
] as const;

const organization: Organization = {
  id: "org-cardshall",
  name: "CardsHall",
  slug: "cardshall",
};

function buildPlayers(): TournamentPlayer[] {
  return PLAYER_NAMES.map((fullName, index) => ({
    id: `tp-${index + 1}`,
    player: {
      id: `player-${index + 1}`,
      fullName,
      playerId: `${1000001 + index}`,
      birthDate: `20${90 + (index % 10)}-0${(index % 8) + 1}-15`,
      category: "MASTER",
      country: "Brasil",
      state: "SP",
      city: "São Paulo",
      nickname: fullName.split(" ")[0],
      deckName: index % 2 === 0 ? "Dragapult ex" : "Gardevoir ex",
    },
    status: "CHECKED_IN",
    checkedInAt: "2026-09-27T11:00:00.000Z",
    hadBye: false,
    initialMatchPoints: 0,
    fixedTable: index === 0 ? 3 : undefined,
  }));
}

function assignRoundResults(tournament: Tournament, roundNumber: number, pattern: MatchResultCode[]) {
  const round = tournament.rounds.find((entry) => entry.number === roundNumber);
  if (!round) return;

  round.matches = round.matches.map((match, index) => ({
    ...match,
    resultCode: match.isBye ? "BYE" : pattern[index % pattern.length],
    updatedAt: new Date(`2026-09-27T1${roundNumber}:${10 + index}:00.000Z`).toISOString(),
  }));

  for (const match of round.matches) {
    if (match.isBye) {
      const player = tournament.players.find((entry) => entry.player.id === match.playerAId);
      if (player) player.hadBye = true;
    }
  }

  round.status = "COMPLETED";
}

export function buildDemoTournament(): Tournament {
  const ruleset = getDefaultPokemonRuleset();
  const players = buildPlayers();
  const tournament: Tournament = {
    id: "tournament-demo",
    slug: "cardshall-league-challenge",
    name: "CardsHall League Challenge",
    organization,
    location: "CardsHall Arena - São Paulo",
    date: "2026-09-27",
    format: "STANDARD",
    state: "ROUND_ACTIVE",
    ruleset,
    players,
    rounds: [],
  };

  for (let roundNumber = 1; roundNumber <= 2; roundNumber += 1) {
    const matches = createRoundMatches(tournament, roundNumber);
    tournament.rounds.push({
      id: `round-${roundNumber}`,
      number: roundNumber,
      startedAt: `2026-09-27T1${roundNumber}:00:00.000Z`,
      endsAt: `2026-09-27T1${roundNumber}:50:00.000Z`,
      status: "ACTIVE",
      matches,
    });

    assignRoundResults(
      tournament,
      roundNumber,
      roundNumber === 1
        ? ["A_WIN_2_0", "B_WIN_2_1", "A_WIN_2_1", "DRAW"]
        : ["B_WIN_2_0", "A_WIN_2_1", "DRAW", "A_WIN_2_0"],
    );
  }

  const round3Matches = createRoundMatches(tournament, 3).map((match, index) => ({
    ...match,
    resultCode:
      match.isBye || index < 10
        ? (["A_WIN_2_0", "A_WIN_2_1", "B_WIN_2_1", "DRAW"][index % 4] as MatchResultCode)
        : "PENDING",
  }));

  tournament.rounds.push({
    id: "round-3",
    number: 3,
    startedAt: "2026-09-27T15:00:00.000Z",
    endsAt: "2026-09-27T15:50:00.000Z",
    status: "ACTIVE",
    matches: round3Matches,
  });

  return tournament;
}

export function getDashboardData() {
  const activeTournament = buildDemoTournament();
  const structure = getTournamentStructure(activeTournament.ruleset, activeTournament.players.length);
  const standings = buildStandings(activeTournament, 2);

  return {
    activeTournament,
    activeStandings: standings,
    activeSummary: {
      name: activeTournament.name,
      location: activeTournament.location,
      format: activeTournament.format,
      players: activeTournament.players.length,
      roundLabel: `Rodada ${activeTournament.rounds.length} / ${structure.swissRounds}`,
      remainingTime: "26:31",
      status: "Em andamento",
      pendingResults: activeTournament.rounds[2].matches.filter((match) => match.resultCode === "PENDING").length,
    },
    upcomingEvents: [
      {
        name: "CardsHall Cup Outubro",
        date: "2026-10-11",
        time: "10:00",
        location: "CardsHall Arena - São Paulo",
        players: 18,
      },
    ],
    finishedEvents: [
      {
        name: "CardsHall League Setembro",
        champion: standings[0]?.fullName ?? "João Silva",
        players: 24,
        format: "STANDARD",
        date: "2026-09-03",
      },
    ],
  };
}
