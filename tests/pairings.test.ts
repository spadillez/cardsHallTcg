import assert from "node:assert/strict";
import test from "node:test";
import { createRoundMatches } from "@/lib/tournament/pairings";
import { buildDemoTournament } from "@/lib/tournament/demo-data";

test("Swiss pairings do not duplicate players and avoid rematches when possible", () => {
  const tournament = buildDemoTournament();
  const nextRoundMatches = createRoundMatches(tournament, 4);
  const seen = new Set<string>();
  const history = new Set(
    tournament.rounds.flatMap((round) =>
      round.matches
        .filter((match) => match.playerBId)
        .map((match) => [match.playerAId, match.playerBId].sort().join("::")),
    ),
  );

  for (const match of nextRoundMatches) {
    assert.equal(seen.has(match.playerAId), false);
    seen.add(match.playerAId);
    assert.notEqual(match.playerAId, match.playerBId);

    if (match.playerBId) {
      assert.equal(seen.has(match.playerBId), false);
      seen.add(match.playerBId);
      assert.equal(history.has([match.playerAId, match.playerBId].sort().join("::")), false);
    }
  }
});

test("Dropped players are excluded from future pairings", () => {
  const tournament = buildDemoTournament();
  tournament.players[0] = { ...tournament.players[0], status: "DROPPED" };
  const matches = createRoundMatches(tournament, 4);

  assert.equal(matches.some((match) => match.playerAId === tournament.players[0].player.id), false);
  assert.equal(matches.some((match) => match.playerBId === tournament.players[0].player.id), false);
});
