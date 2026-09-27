export type TournamentFormat = "STANDARD" | "EXPANDED" | "UNLIMITED" | "CUSTOM";
export type TournamentCategory = "JUNIOR" | "SENIOR" | "MASTER" | "OPEN";
export type TournamentState =
  | "DRAFT"
  | "REGISTRATION"
  | "CHECK_IN"
  | "READY"
  | "ROUND_ACTIVE"
  | "ROUND_RESULTS"
  | "BETWEEN_ROUNDS"
  | "SWISS_COMPLETE"
  | "TOP_CUT"
  | "FINISHED"
  | "ARCHIVED";

export type RegistrationStatus =
  | "PRE_REGISTERED"
  | "REGISTERED"
  | "CHECKED_IN"
  | "LATE_REGISTRATION"
  | "DROPPED"
  | "DISQUALIFIED"
  | "FINISHED";

export type MatchResultCode =
  | "PENDING"
  | "A_WIN_2_0"
  | "A_WIN_2_1"
  | "B_WIN_2_0"
  | "B_WIN_2_1"
  | "DRAW"
  | "DOUBLE_LOSS"
  | "BYE";

export interface ScoringRule {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  byePoints: number;
  doubleLossPoints: number;
}

export interface WinPercentageRules {
  minimumMatchWinPercentage: number;
  minimumGameWinPercentage: number;
}

export interface AllowedResultDefinition {
  code: MatchResultCode;
  label: string;
  winner: "A" | "B" | "DRAW" | "NONE";
  gamesWonA: number;
  gamesWonB: number;
  gamesDrawn?: number;
}

export interface TournamentStructureRule {
  minPlayers: number;
  maxPlayers: number;
  swissRounds: number;
  topCut: number;
}

export interface TournamentRuleset {
  name: string;
  version: string;
  effectiveDate: string;
  game: string;
  format: TournamentFormat;
  settings: {
    scoring: ScoringRule;
    tiebreakerOrder: Array<"OMW" | "GW" | "OGW">;
    percentages: WinPercentageRules;
    allowedResults: AllowedResultDefinition[];
    structures: TournamentStructureRule[];
    roundTimeMinutes: number;
    tableStart: number;
    reservedTables: number[];
    matchFormat: "BO1" | "BO3" | "BO5" | "CUSTOM";
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Player {
  id: string;
  fullName: string;
  playerId: string;
  birthDate: string;
  category: TournamentCategory;
  country: string;
  state: string;
  city: string;
  nickname?: string;
  deckName?: string;
}

export interface TournamentPlayer {
  id: string;
  player: Player;
  status: RegistrationStatus;
  checkedInAt?: string;
  droppedAt?: string;
  fixedTable?: number;
  hadBye: boolean;
  initialMatchPoints: number;
}

export interface Match {
  id: string;
  roundNumber: number;
  tableNumber: number;
  playerAId: string;
  playerBId?: string;
  resultCode: MatchResultCode;
  createdAt: string;
  updatedAt: string;
  isBye: boolean;
}

export interface Round {
  id: string;
  number: number;
  startedAt: string;
  endsAt: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED";
  matches: Match[];
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  organization: Organization;
  location: string;
  date: string;
  format: TournamentFormat;
  state: TournamentState;
  ruleset: TournamentRuleset;
  players: TournamentPlayer[];
  rounds: Round[];
}

export interface StandingRow {
  rank: number;
  playerId: string;
  fullName: string;
  record: string;
  matchPoints: number;
  omw: number;
  gw: number;
  ogw: number;
  wins: number;
  losses: number;
  draws: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  opponents: string[];
}

export interface GeneratedPairing {
  playerAId: string;
  playerBId?: string;
  isBye: boolean;
  tableNumber: number;
}
