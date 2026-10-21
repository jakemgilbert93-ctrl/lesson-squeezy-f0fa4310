import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LessonIdInput } from "./lesson-id";

describe("lesson read and delete ID validation", () => {
  it("accepts a UUID for existing lesson reads and deletes", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    assert.deepEqual(LessonIdInput.parse({ id }), { id });
  });

  it("rejects malformed, missing, and non-string lesson IDs", () => {
    for (const input of [{ id: "not-a-uuid" }, { id: "" }, {}, { id: 123 }, null]) {
      assert.equal(LessonIdInput.safeParse(input).success, false);
    }
  });
});