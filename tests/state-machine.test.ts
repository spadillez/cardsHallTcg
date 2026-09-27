import assert from "node:assert/strict";
import test from "node:test";
import { canTransition } from "@/lib/tournament/state-machine";

test("Tournament state machine allows the expected forward transitions", () => {
  assert.equal(canTransition("DRAFT", "REGISTRATION"), true);
  assert.equal(canTransition("CHECK_IN", "READY"), true);
  assert.equal(canTransition("BETWEEN_ROUNDS", "ROUND_ACTIVE"), true);
  assert.equal(canTransition("SWISS_COMPLETE", "TOP_CUT"), true);
  assert.equal(canTransition("FINISHED", "ARCHIVED"), true);
});

test("Tournament state machine blocks invalid transitions", () => {
  assert.equal(canTransition("DRAFT", "ROUND_ACTIVE"), false);
  assert.equal(canTransition("ROUND_ACTIVE", "READY"), false);
  assert.equal(canTransition("SWISS_COMPLETE", "CHECK_IN"), false);
  assert.equal(canTransition("ARCHIVED", "DRAFT"), false);
});
