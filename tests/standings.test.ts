import assert from "node:assert/strict";
import test from "node:test";
import { buildDemoTournament } from "@/lib/tournament/demo-data";
import { buildStandings } from "@/lib/tournament/standings";

test("Standings calculate points and order players by points then tiebreakers", () => {
  const tournament = buildDemoTournament();
  const standings = buildStandings(tournament, 2);

  assert.equal(standings.length, 32);
  assert.ok(standings[0].matchPoints >= standings[1].matchPoints);
  assert.ok(standings.every((entry) => entry.omw >= 0 && entry.gw >= 0 && entry.ogw >= 0));
});

test("Completed results update the live standings snapshot", () => {
  const tournament = buildDemoTournament();
  const pending = tournament.rounds[2].matches.find((match) => match.resultCode === "PENDING");
  assert.ok(pending);
  if (!pending) return;
  const before = buildStandings(tournament);
  const playerABefore = before.find((entry) => entry.playerId === pending.playerAId);
  const playerBBefore = before.find((entry) => entry.playerId === pending.playerBId);

  pending.resultCode = "A_WIN_2_0";
  const after = buildStandings(tournament);
  const playerAAfter = after.find((entry) => entry.playerId === pending.playerAId);
  const playerBAfter = after.find((entry) => entry.playerId === pending.playerBId);

  assert.ok(playerABefore && playerAAfter && playerBBefore && playerBAfter);
  assert.equal(playerAAfter.matchPoints, playerABefore.matchPoints + 3);
  assert.equal(playerBAfter.matchPoints, playerBBefore.matchPoints);
});
