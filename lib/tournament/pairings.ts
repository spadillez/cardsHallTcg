import { buildStandings } from "@/lib/tournament/standings";
import type { GeneratedPairing, Match, Tournament, TournamentPlayer } from "@/lib/tournament/types";

function buildHistory(tournament: Tournament) {
  const history = new Map<string, Set<string>>();

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (!match.playerBId) {
        continue;
      }

      if (!history.has(match.playerAId)) history.set(match.playerAId, new Set());
      if (!history.has(match.playerBId)) history.set(match.playerBId, new Set());
      history.get(match.playerAId)?.add(match.playerBId);
      history.get(match.playerBId)?.add(match.playerAId);
    }
  }

  return history;
}

function nextTableNumbers(tournament: Tournament, pairingCount: number) {
  const reserved = new Set(tournament.ruleset.settings.reservedTables);
  const tables: number[] = [];
  let current = tournament.ruleset.settings.tableStart;

  while (tables.length < pairingCount) {
    if (!reserved.has(current)) {
      tables.push(current);
    }

    current += 1;
  }

  return tables;
}

function rankEligiblePlayers(tournament: Tournament) {
  const standings = buildStandings(tournament);
  const byStanding = new Map(standings.map((standing) => [standing.playerId, standing.rank]));

  return tournament.players
    .filter((entry) => entry.status !== "DROPPED" && entry.status !== "DISQUALIFIED")
    .sort((left, right) => {
      const leftRank = byStanding.get(left.player.id) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = byStanding.get(right.player.id) ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.player.fullName.localeCompare(right.player.fullName, "pt-BR");
    });
}

function chooseBye(players: TournamentPlayer[]) {
  const withoutBye = [...players].reverse().find((player) => !player.hadBye);
  return withoutBye ?? players[players.length - 1];
}

function canPair(a: TournamentPlayer, b: TournamentPlayer, history: Map<string, Set<string>>) {
  return !history.get(a.player.id)?.has(b.player.id);
}

function assignTables(
  pairings: Array<Omit<GeneratedPairing, "tableNumber">>,
  tournament: Tournament,
): GeneratedPairing[] {
  const tables = nextTableNumbers(tournament, pairings.length);
  const usedTables = new Set<number>();
  const reservedTables = new Set(tournament.ruleset.settings.reservedTables);

  return pairings.map((pairing, index) => {
    const playerA = tournament.players.find((entry) => entry.player.id === pairing.playerAId);
    const playerB = pairing.playerBId
      ? tournament.players.find((entry) => entry.player.id === pairing.playerBId)
      : undefined;
    const fixedTable = [playerA?.fixedTable, playerB?.fixedTable].find(
      (tableNumber) => tableNumber && !usedTables.has(tableNumber) && !reservedTables.has(tableNumber),
    );
    const tableNumber = fixedTable ?? tables[index];
    usedTables.add(tableNumber);
    return { ...pairing, tableNumber };
  });
}

function backtrack(
  players: TournamentPlayer[],
  history: Map<string, Set<string>>,
  current: Array<Omit<GeneratedPairing, "tableNumber">>,
): Array<Omit<GeneratedPairing, "tableNumber">> | null {
  if (players.length === 0) {
    return current;
  }

  const [first, ...rest] = players;
  const candidates = [...rest].sort((left, right) => {
    const leftRematch = canPair(first, left, history) ? 0 : 1;
    const rightRematch = canPair(first, right, history) ? 0 : 1;
    if (leftRematch !== rightRematch) return leftRematch - rightRematch;
    return left.player.fullName.localeCompare(right.player.fullName, "pt-BR");
  });

  for (const opponent of candidates) {
    if (!canPair(first, opponent, history)) {
      continue;
    }

    const remainder = rest.filter((entry) => entry.player.id !== opponent.player.id);
    const outcome = backtrack(remainder, history, [
      ...current,
      { playerAId: first.player.id, playerBId: opponent.player.id, isBye: false },
    ]);
    if (outcome) {
      return outcome;
    }
  }

  const fallbackOpponent = rest[0];
  if (!fallbackOpponent) {
    return null;
  }

  const remainder = rest.filter((entry) => entry.player.id !== fallbackOpponent.player.id);
  return backtrack(
    remainder,
    history,
    [...current, { playerAId: first.player.id, playerBId: fallbackOpponent.player.id, isBye: false }],
  );
}

export function generateSwissPairings(tournament: Tournament): GeneratedPairing[] {
  const ranked = rankEligiblePlayers(tournament);
  const history = buildHistory(tournament);
  const working = [...ranked];
  const pairings: Array<Omit<GeneratedPairing, "tableNumber">> = [];

  if (working.length % 2 === 1) {
    const byePlayer = chooseBye(working);
    pairings.push({ playerAId: byePlayer.player.id, isBye: true });
    working.splice(
      working.findIndex((entry) => entry.player.id === byePlayer.player.id),
      1,
    );
  }

  const swissPairs = backtrack(working, history, []);
  if (!swissPairs) {
    throw new Error("Unable to build pairings for the current standings.");
  }

  return assignTables([...pairings, ...swissPairs], tournament);
}

export function createRoundMatches(tournament: Tournament, roundNumber: number): Match[] {
  const now = new Date().toISOString();

  return generateSwissPairings(tournament).map((pairing, index) => ({
    id: `round-${roundNumber}-match-${index + 1}`,
    roundNumber,
    tableNumber: pairing.tableNumber,
    playerAId: pairing.playerAId,
    playerBId: pairing.playerBId,
    resultCode: pairing.isBye ? "BYE" : "PENDING",
    createdAt: now,
    updatedAt: now,
    isBye: pairing.isBye,
  }));
}
