import assert from "node:assert/strict";
import test from "node:test";
import { createRoundMatches } from "@/lib/tournament/pairings";
import { buildDemoTournament } from "@/lib/tournament/demo-data";
import type { Tournament } from "@/lib/tournament/types";

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

test("Fallback rematch pairing still uses each eligible player at most once", () => {
  const tournament = buildDemoTournament();
  const players = tournament.players.slice(0, 4);
  const ids = players.map((entry) => entry.player.id);

  const forcedFallbackTournament: Tournament = {
    ...tournament,
    players,
    rounds: [
      {
        id: "round-1",
        number: 1,
        startedAt: "2026-09-27T11:00:00.000Z",
        endsAt: "2026-09-27T11:50:00.000Z",
        status: "COMPLETED",
        matches: [
          {
            id: "r1m1",
            roundNumber: 1,
            tableNumber: 11,
            playerAId: ids[0],
            playerBId: ids[1],
            resultCode: "A_WIN_2_0",
            createdAt: "2026-09-27T11:00:00.000Z",
            updatedAt: "2026-09-27T11:20:00.000Z",
            isBye: false,
          },
          {
            id: "r1m2",
            roundNumber: 1,
            tableNumber: 12,
            playerAId: ids[2],
            playerBId: ids[3],
            resultCode: "A_WIN_2_0",
            createdAt: "2026-09-27T11:00:00.000Z",
            updatedAt: "2026-09-27T11:20:00.000Z",
            isBye: false,
          },
        ],
      },
      {
        id: "round-2",
        number: 2,
        startedAt: "2026-09-27T12:00:00.000Z",
        endsAt: "2026-09-27T12:50:00.000Z",
        status: "COMPLETED",
        matches: [
          {
            id: "r2m1",
            roundNumber: 2,
            tableNumber: 11,
            playerAId: ids[0],
            playerBId: ids[2],
            resultCode: "A_WIN_2_0",
            createdAt: "2026-09-27T12:00:00.000Z",
            updatedAt: "2026-09-27T12:20:00.000Z",
            isBye: false,
          },
          {
            id: "r2m2",
            roundNumber: 2,
            tableNumber: 12,
            playerAId: ids[1],
            playerBId: ids[3],
            resultCode: "A_WIN_2_0",
            createdAt: "2026-09-27T12:00:00.000Z",
            updatedAt: "2026-09-27T12:20:00.000Z",
            isBye: false,
          },
        ],
      },
      {
        id: "round-3",
        number: 3,
        startedAt: "2026-09-27T13:00:00.000Z",
        endsAt: "2026-09-27T13:50:00.000Z",
        status: "COMPLETED",
        matches: [
          {
            id: "r3m1",
            roundNumber: 3,
            tableNumber: 11,
            playerAId: ids[0],
            playerBId: ids[3],
            resultCode: "A_WIN_2_0",
            createdAt: "2026-09-27T13:00:00.000Z",
            updatedAt: "2026-09-27T13:20:00.000Z",
            isBye: false,
          },
          {
            id: "r3m2",
            roundNumber: 3,
            tableNumber: 12,
            playerAId: ids[1],
            playerBId: ids[2],
            resultCode: "A_WIN_2_0",
            createdAt: "2026-09-27T13:00:00.000Z",
            updatedAt: "2026-09-27T13:20:00.000Z",
            isBye: false,
          },
        ],
      },
    ],
  };

  const matches = createRoundMatches(forcedFallbackTournament, 4);
  const seen = new Set<string>();

  for (const match of matches) {
    assert.equal(seen.has(match.playerAId), false);
    seen.add(match.playerAId);
    if (match.playerBId) {
      assert.equal(seen.has(match.playerBId), false);
      seen.add(match.playerBId);
    }
  }

  assert.equal(seen.size, players.length);
});

test("Fixed table assignments do not create duplicate table numbers", () => {
  const tournament = buildDemoTournament();
  tournament.players[0] = { ...tournament.players[0], fixedTable: 11 };
  const matches = createRoundMatches(tournament, 4);
  const tableNumbers = matches.map((match) => match.tableNumber);
  const uniqueTableNumbers = new Set(tableNumbers);

  assert.equal(tableNumbers.includes(11), true);
  assert.equal(uniqueTableNumbers.size, tableNumbers.length);
});
