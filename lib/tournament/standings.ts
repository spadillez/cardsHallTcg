import { getResultDefinition } from "@/lib/tournament/rules";
import type { Match, StandingRow, Tournament, TournamentRuleset } from "@/lib/tournament/types";

type InterimRow = Omit<StandingRow, "rank" | "record" | "fullName"> & {
  fullName: string;
  matchesPlayed: number;
  gamesPlayed: number;
};

function clampFloor(value: number, floor: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return floor;
  }

  return Math.max(value, floor);
}

function roundPercentage(value: number) {
  return Number((value * 100).toFixed(2));
}

function isCompletedMatch(match: Match) {
  return match.resultCode !== "PENDING";
}

export function buildStandings(tournament: Tournament, upToRound?: number): StandingRow[] {
  const activePlayers = tournament.players.filter(
    (entry) => entry.status !== "DISQUALIFIED" && entry.status !== "DROPPED",
  );
  const rows = new Map<string, InterimRow>();

  for (const entry of activePlayers) {
    rows.set(entry.player.id, {
      playerId: entry.player.id,
      fullName: entry.player.fullName,
      matchPoints: entry.initialMatchPoints,
      omw: 0,
      gw: 0,
      ogw: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
      opponents: [],
      matchesPlayed: 0,
      gamesPlayed: 0,
    });
  }

  const rounds = tournament.rounds.filter((round) => (upToRound ? round.number <= upToRound : true));

  for (const round of rounds) {
    for (const match of round.matches) {
      if (!isCompletedMatch(match)) {
        continue;
      }

      const playerA = rows.get(match.playerAId);
      if (!playerA) {
        continue;
      }

      const result = getResultDefinition(tournament.ruleset, match.resultCode);
      const scoring = tournament.ruleset.settings.scoring;
      const gamesDrawn = result.gamesDrawn ?? 0;

      playerA.gamesWon += result.gamesWonA;
      playerA.gamesLost += result.gamesWonB;
      playerA.gamesDrawn += gamesDrawn;
      playerA.gamesPlayed += result.gamesWonA + result.gamesWonB + gamesDrawn;

      if (match.isBye && match.resultCode === "BYE") {
        playerA.wins += 1;
        playerA.matchPoints += scoring.byePoints;
        playerA.matchesPlayed += 1;
        continue;
      }

      if (!match.playerBId) {
        continue;
      }

      const playerB = rows.get(match.playerBId);
      if (!playerB) {
        continue;
      }

      playerB.gamesWon += result.gamesWonB;
      playerB.gamesLost += result.gamesWonA;
      playerB.gamesDrawn += gamesDrawn;
      playerB.gamesPlayed += result.gamesWonA + result.gamesWonB + gamesDrawn;
      playerA.matchesPlayed += 1;
      playerB.matchesPlayed += 1;
      playerA.opponents.push(playerB.playerId);
      playerB.opponents.push(playerA.playerId);

      switch (result.winner) {
        case "A":
          playerA.wins += 1;
          playerB.losses += 1;
          playerA.matchPoints += scoring.winPoints;
          playerB.matchPoints += scoring.lossPoints;
          break;
        case "B":
          playerB.wins += 1;
          playerA.losses += 1;
          playerB.matchPoints += scoring.winPoints;
          playerA.matchPoints += scoring.lossPoints;
          break;
        case "DRAW":
          playerA.draws += 1;
          playerB.draws += 1;
          playerA.matchPoints += scoring.drawPoints;
          playerB.matchPoints += scoring.drawPoints;
          break;
        case "NONE":
          playerA.losses += 1;
          playerB.losses += 1;
          playerA.matchPoints += scoring.doubleLossPoints;
          playerB.matchPoints += scoring.doubleLossPoints;
          break;
      }
    }
  }

  applyPercentages(rows, tournament.ruleset);

  return [...rows.values()]
    .sort((left, right) => {
      if (right.matchPoints !== left.matchPoints) return right.matchPoints - left.matchPoints;
      for (const tiebreaker of tournament.ruleset.settings.tiebreakerOrder) {
        const difference =
          tiebreaker === "OMW"
            ? right.omw - left.omw
            : tiebreaker === "GW"
              ? right.gw - left.gw
              : right.ogw - left.ogw;
        if (difference !== 0) {
          return difference;
        }
      }
      return left.fullName.localeCompare(right.fullName, "pt-BR");
    })
    .map((row, index) => ({
      rank: index + 1,
      playerId: row.playerId,
      fullName: row.fullName,
      record: `${row.wins}-${row.losses}-${row.draws}`,
      matchPoints: row.matchPoints,
      omw: row.omw,
      gw: row.gw,
      ogw: row.ogw,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      gamesWon: row.gamesWon,
      gamesLost: row.gamesLost,
      gamesDrawn: row.gamesDrawn,
      opponents: row.opponents,
    }));
}

function applyPercentages(rows: Map<string, InterimRow>, ruleset: TournamentRuleset) {
  const scoring = ruleset.settings.scoring;
  const maxMatchPoints = Math.max(scoring.winPoints, 1);
  const opponentMatchWin = new Map<string, number>();
  const opponentGameWin = new Map<string, number>();

  for (const row of rows.values()) {
    const matchWin = row.matchesPlayed
      ? clampFloor(row.matchPoints / (row.matchesPlayed * maxMatchPoints), ruleset.settings.percentages.minimumMatchWinPercentage)
      : ruleset.settings.percentages.minimumMatchWinPercentage;
    const gameWin = row.gamesPlayed
      ? clampFloor(
          (row.gamesWon + row.gamesDrawn * 0.5) / row.gamesPlayed,
          ruleset.settings.percentages.minimumGameWinPercentage,
        )
      : ruleset.settings.percentages.minimumGameWinPercentage;

    opponentMatchWin.set(row.playerId, matchWin);
    opponentGameWin.set(row.playerId, gameWin);
    row.gw = roundPercentage(gameWin);
  }

  for (const row of rows.values()) {
    row.omw = roundPercentage(average(row.opponents.map((opponentId) => opponentMatchWin.get(opponentId) ?? 0)));
    row.ogw = roundPercentage(average(row.opponents.map((opponentId) => opponentGameWin.get(opponentId) ?? 0)));
  }
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
