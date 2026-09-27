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

test("Pending matches do not affect the live standings snapshot", () => {
  const tournament = buildDemoTournament();
  const before = buildStandings(tournament).map((entry) => ({ id: entry.playerId, points: entry.matchPoints }));
  const pending = tournament.rounds[2].matches.find((match) => match.resultCode === "PENDING");
  assert.ok(pending);
  if (!pending) return;

  pending.resultCode = "A_WIN_2_0";
  const after = buildStandings(tournament).map((entry) => ({ id: entry.playerId, points: entry.matchPoints }));

  assert.notDeepEqual(before, after);
});
