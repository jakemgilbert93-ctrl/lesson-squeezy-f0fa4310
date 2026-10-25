import { describe, expect, test } from "bun:test";
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
    expect(text).toContain("Name:");
    expect(text).not.toContain("SOLUTION-1");
    expect(text).not.toContain("Correct answer");
  });
  test("quiz answer key has correct answer and worked solution", async () => {
    const text = await docText(await createMaterialDocx({ ...base, itemType: "quiz", content: quiz }, "key"));
    expect(text).toContain("Correct answer: C. Charlie");
    expect(text).toContain("SOLUTION-5");
  });
  test("exit ticket student copy omits teacher notes; key includes them", async () => {
    const student = await docText(await createMaterialDocx({ ...base, itemType: "exit_ticket", content: ticket }, "student"));
    const key = await docText(await createMaterialDocx({ ...base, itemType: "exit_ticket", content: ticket }, "key"));
    expect(student).not.toContain("SECRET-NOTES");
    expect(key).toContain("SECRET-NOTES");
  });
  test("student copy text excludes answers", () => {
    expect(materialToText({ itemType: "quiz", itemTitle: "T", content: quiz }, "student")).not.toContain("SOLUTION");
  });
});
