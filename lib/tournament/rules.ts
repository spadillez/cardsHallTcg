import type { AllowedResultDefinition, MatchResultCode, TournamentRuleset } from "@/lib/tournament/types";

export function getDefaultPokemonRuleset(): TournamentRuleset {
  const allowedResults: AllowedResultDefinition[] = [
    { code: "A_WIN_2_0", label: "2 - 0", winner: "A", gamesWonA: 2, gamesWonB: 0 },
    { code: "A_WIN_2_1", label: "2 - 1", winner: "A", gamesWonA: 2, gamesWonB: 1 },
    { code: "B_WIN_2_0", label: "0 - 2", winner: "B", gamesWonA: 0, gamesWonB: 2 },
    { code: "B_WIN_2_1", label: "1 - 2", winner: "B", gamesWonA: 1, gamesWonB: 2 },
    { code: "DRAW", label: "Draw", winner: "DRAW", gamesWonA: 1, gamesWonB: 1, gamesDrawn: 1 },
    { code: "DOUBLE_LOSS", label: "Double Loss", winner: "NONE", gamesWonA: 0, gamesWonB: 0 },
    { code: "BYE", label: "BYE", winner: "A", gamesWonA: 2, gamesWonB: 0 },
  ];

  return {
    name: "Pokemon TCG Competitive Rules",
    version: "2026.1",
    effectiveDate: "2026-01-01",
    game: "Pokemon TCG",
    format: "STANDARD",
    settings: {
      scoring: {
        winPoints: 3,
        drawPoints: 1,
        lossPoints: 0,
        byePoints: 3,
        doubleLossPoints: 0,
      },
      tiebreakerOrder: ["OMW", "GW", "OGW"],
      percentages: {
        minimumMatchWinPercentage: 0.33,
        minimumGameWinPercentage: 0.33,
      },
      allowedResults,
      structures: [
        { minPlayers: 2, maxPlayers: 8, swissRounds: 3, topCut: 0 },
        { minPlayers: 9, maxPlayers: 16, swissRounds: 4, topCut: 4 },
        { minPlayers: 17, maxPlayers: 32, swissRounds: 5, topCut: 8 },
        { minPlayers: 33, maxPlayers: 64, swissRounds: 6, topCut: 8 },
        { minPlayers: 65, maxPlayers: 128, swissRounds: 7, topCut: 8 },
      ],
      roundTimeMinutes: 50,
      tableStart: 11,
      reservedTables: [1, 2, 40],
      matchFormat: "BO3",
    },
  };
}

export function getResultDefinition(ruleset: TournamentRuleset, resultCode: MatchResultCode) {
  const result = ruleset.settings.allowedResults.find((entry) => entry.code === resultCode);
  if (!result) {
    throw new Error(`Unsupported result code: ${resultCode}`);
  }

  return result;
}

export function getTournamentStructure(ruleset: TournamentRuleset, playerCount: number) {
  const matchingStructure = ruleset.settings.structures.find(
    (structure) => playerCount >= structure.minPlayers && playerCount <= structure.maxPlayers,
  );
  if (matchingStructure) {
    return matchingStructure;
  }

  return playerCount < ruleset.settings.structures[0].minPlayers
    ? ruleset.settings.structures[0]
    : ruleset.settings.structures[ruleset.settings.structures.length - 1];
}
