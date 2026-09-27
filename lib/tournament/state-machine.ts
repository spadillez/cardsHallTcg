import type { TournamentState } from "@/lib/tournament/types";

const transitions: Record<TournamentState, TournamentState[]> = {
  DRAFT: ["REGISTRATION"],
  REGISTRATION: ["CHECK_IN"],
  CHECK_IN: ["READY"],
  READY: ["ROUND_ACTIVE"],
  ROUND_ACTIVE: ["ROUND_RESULTS", "BETWEEN_ROUNDS"],
  ROUND_RESULTS: ["BETWEEN_ROUNDS", "SWISS_COMPLETE"],
  BETWEEN_ROUNDS: ["ROUND_ACTIVE", "SWISS_COMPLETE"],
  SWISS_COMPLETE: ["TOP_CUT", "FINISHED"],
  TOP_CUT: ["FINISHED"],
  FINISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(current: TournamentState, next: TournamentState) {
  return transitions[current].includes(next);
}
