import { describe, test } from "bun:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { createMaterialDocx, materialDownloads, materialToText } from "./materials-docx";

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
const worksheet = {
  directions: "Show your work.",
  questions: Array.from({ length: 8 }, (_, i) => i % 2
    ? { prompt: `WQ-${i + 1}`, type: "multiple_choice", choices: ["One", "Two", "Three"], answer: `WS-ANSWER-${i + 1}`, workedSolution: `WS-SOLUTION-${i + 1}` }
    : { prompt: `WQ-${i + 1}`, type: "short_answer", answerLines: 2, answer: `WS-ANSWER-${i + 1}`, workedSolution: `WS-SOLUTION-${i + 1}` }),
};
const vocab = {
  cards: Array.from({ length: 6 }, (_, i) => ({
    term: `TERM-${i + 1}`, studentFriendlyDefinition: `DEF-${i + 1}`, exampleSentence: `EX-${i + 1}`, memoryHint: `HINT-${i + 1}`,
  })),
};
const game = {
  gameName: "Fraction Scoot", format: "scoot", materialsNeeded: ["Cards"], setup: "SETUP-TEXT", howToPlay: ["STEP-1"],
  cards: Array.from({ length: 10 }, (_, i) => ({ prompt: `PROMPT-${i + 1}`, answer: `G-ANSWER-${i + 1}`, workedSolution: `G-SOLUTION-${i + 1}` })),
  teacherNotes: "G-NOTES",
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

  test("worksheet student copy has no answers or solutions; key has both", async () => {
    const student = await docText(await createMaterialDocx({ ...base, itemType: "worksheet", content: worksheet }, "student"));
    const key = await docText(await createMaterialDocx({ ...base, itemType: "worksheet", content: worksheet }, "key"));
    assert.ok(student.includes("Name:"));
    assert.ok(!student.includes("WS-ANSWER") && !student.includes("WS-SOLUTION"));
    assert.ok(key.includes("WS-ANSWER-8") && key.includes("WS-SOLUTION-8"));
    assert.ok(!materialToText({ itemType: "worksheet", itemTitle: "T", content: worksheet }, "student").includes("WS-ANSWER"));
  });
  test("vocabulary cards student copy prints every card and offers no answer key", async () => {
    const text = await docText(await createMaterialDocx({ ...base, itemType: "vocab_cards", content: vocab }, "student"));
    assert.ok(text.includes("TERM-6") && text.includes("Hint: HINT-1"));
    assert.deepEqual(materialDownloads("vocab_cards").map((d) => d.copy), ["student"]);
  });
  test("game student cards omit answers, solutions and teacher notes; guide has them", async () => {
    const student = await docText(await createMaterialDocx({ ...base, itemType: "game", content: game }, "student"));
    const guide = await docText(await createMaterialDocx({ ...base, itemType: "game", content: game }, "key"));
    assert.ok(student.includes("PROMPT-10"));
    for (const secret of ["G-ANSWER", "G-SOLUTION", "G-NOTES"]) assert.ok(!student.includes(secret), secret);
    assert.ok(guide.includes("G-ANSWER-10") && guide.includes("G-SOLUTION-10") && guide.includes("G-NOTES"));
    assert.ok(guide.includes("SETUP-TEXT") && guide.includes("STEP-1"));
    const studentText = materialToText({ itemType: "game", itemTitle: "T", content: game }, "student");
    assert.ok(!studentText.includes("G-ANSWER") && !studentText.includes("G-NOTES"));
  });
});
