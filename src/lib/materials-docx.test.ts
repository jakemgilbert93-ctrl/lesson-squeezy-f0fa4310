import { describe, test } from "bun:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { createMaterialDocx, materialToText } from "./materials-docx";

const quiz = {
  directions: "Choose the best answer.",
  questions: Array.from({ length: 5 }, (_, i) => ({
    prompt: `Question ${i + 1}?`,
    choices: ["Alpha", "Bravo", "Charlie", "Delta"],
    correctIndex: 2,
    workedSolution: `SOLUTION-${i + 1}`,
  })),
};
const ticket = {
  directions: "Answer in full sentences.",
  questions: [{ prompt: "What did you learn?", type: "short_answer", answerLines: 3 }],
  teacherNotes: "SECRET-NOTES",
};
const base = { itemTitle: "T", lessonTitle: "Fractions", grade: "3", withStandardsFooter: false };

async function docText(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return (await zip.file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, "");
}

describe("materials docx", () => {
  test("quiz student copy has no answers or solutions", async () => {
    const text = await docText(await createMaterialDocx({ ...base, itemType: "quiz", content: quiz }, "student"));
    assert.ok(text.includes("Name:"));
    assert.ok(!text.includes("SOLUTION-1"));
    assert.ok(!text.includes("Correct answer"));
  });
  test("quiz answer key has correct answer and worked solution", async () => {
    const text = await docText(await createMaterialDocx({ ...base, itemType: "quiz", content: quiz }, "key"));
    assert.ok(text.includes("Correct answer: C. Charlie"));
    assert.ok(text.includes("SOLUTION-5"));
  });
  test("exit ticket student copy omits teacher notes; key includes them", async () => {
    const student = await docText(await createMaterialDocx({ ...base, itemType: "exit_ticket", content: ticket }, "student"));
    const key = await docText(await createMaterialDocx({ ...base, itemType: "exit_ticket", content: ticket }, "key"));
    assert.ok(!student.includes("SECRET-NOTES"));
    assert.ok(key.includes("SECRET-NOTES"));
  });
  test("student copy text excludes answers", () => {
    assert.ok(!materialToText({ itemType: "quiz", itemTitle: "T", content: quiz }, "student").includes("SOLUTION"));
  });
});
