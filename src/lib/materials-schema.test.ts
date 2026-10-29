import { test } from "bun:test";
import assert from "node:assert/strict";
import { APP_CONFIG, limitsFor } from "@/config/app-config";
import { ExitTicketContent, QuizContent, WorksheetContent, VocabCardsContent, GameContent, GenerateMaterialInput, quizAnswerKey, worksheetAnswerKey, gameAnswerKey } from "./materials-schema";

const question = { prompt: "What is 2 + 3?", choices: ["4", "5", "6", "7"], correctIndex: 1, workedSolution: "Start with 2. Add 3: 2 + 3 = 5." };
const quiz = { directions: "Choose one answer.", questions: Array.from({ length: 5 }, () => ({ ...question })) };

test("Pro has a 60-lesson monthly cap", () => assert.equal(limitsFor("pro").monthlyLessons, 60));
test("Free materials allow 2 regenerations per item", () => assert.equal(limitsFor("free").regensPerMaterial, 2));
test("Pro materials allow 5 regenerations per item", () => assert.equal(limitsFor("pro").regensPerMaterial, 5));
test("Free lesson section regenerations stay at 5", () => assert.equal(limitsFor("free").regensPerLesson, 5));
test("Pro lesson section regenerations stay at 15", () => assert.equal(limitsFor("pro").regensPerLesson, 15));
test("monthly materials caps are Free 1 and Pro 60, matching the database function", () => {
  assert.equal(limitsFor("free").monthlyMaterials, 1);
  assert.equal(limitsFor("pro").monthlyMaterials, 60);
});
test("five material types can be generated for a saved UUID lesson", () => {
  assert.deepEqual(APP_CONFIG.materials.itemTypes, ["exit_ticket", "quiz", "worksheet", "vocab_cards", "game"]);
  assert.equal(GenerateMaterialInput.safeParse({ lessonId: "bad", itemType: "quiz" }).success, false);
  assert.equal(GenerateMaterialInput.safeParse({ lessonId: "43552554-0714-4e82-9b7b-7b9be3cf6c11", itemType: "slides" }).success, false);
  assert.equal(GenerateMaterialInput.safeParse({ lessonId: "43552554-0714-4e82-9b7b-7b9be3cf6c11", itemType: "worksheet" }).success, true);
});
test("a quiz requires exactly 5 questions", () => {
  assert.equal(QuizContent.safeParse(quiz).success, true);
  assert.equal(QuizContent.safeParse({ ...quiz, questions: quiz.questions.slice(1) }).success, false);
  assert.equal(QuizContent.safeParse({ ...quiz, questions: [...quiz.questions, question] }).success, false);
});
test("each quiz question requires four distinct choices and one valid answer index", () => {
  for (const invalid of [{ ...question, choices: ["4", "5", "6"] }, { ...question, choices: ["4", "5", "5", "7"] }, { ...question, correctIndex: 4 }, { ...question, correctIndex: -1 }]) {
    assert.equal(QuizContent.safeParse({ ...quiz, questions: [invalid, ...quiz.questions.slice(1)] }).success, false);
  }
});
test("quiz choices cannot use all of the above", () => {
  assert.equal(QuizContent.safeParse({ ...quiz, questions: [{ ...question, choices: ["4", "5", "6", "All of the above"] }, ...quiz.questions.slice(1)] }).success, false);
});
test("quiz answers include the selected choice and worked solution", () => {
  const key = quizAnswerKey(QuizContent.parse(quiz));
  assert.ok(key.includes("1. B. 5\nStart with 2. Add 3: 2 + 3 = 5."));
  assert.equal(QuizContent.safeParse({ ...quiz, questions: [{ ...question, workedSolution: "" }, ...quiz.questions.slice(1)] }).success, false);
});
test("exit tickets support short answers with lines and multiple choice with choices", () => {
  assert.equal(ExitTicketContent.safeParse({ directions: "Answer.", questions: [{ prompt: "Explain.", type: "short_answer", answerLines: 3 }, { prompt: "Choose.", type: "multiple_choice", choices: ["Yes", "No"] }], teacherNotes: "Expected answers" }).success, true);
  assert.equal(ExitTicketContent.safeParse({ directions: "Answer.", questions: [{ prompt: "Choose.", type: "multiple_choice" }], teacherNotes: "" }).success, false);
});

const worksheetQuestion = { prompt: "Solve 4 × 6.", type: "short_answer" as const, answer: "24", workedSolution: "4 groups of 6: 6 + 6 + 6 + 6 = 24." };
const worksheet = { directions: "Show your work.", questions: Array.from({ length: 8 }, () => ({ ...worksheetQuestion })) };

test("a worksheet requires 8 to 10 questions, each with an answer and worked solution", () => {
  assert.equal(WorksheetContent.safeParse(worksheet).success, true);
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: worksheet.questions.slice(1) }).success, false);
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: Array.from({ length: 11 }, () => ({ ...worksheetQuestion })) }).success, false);
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: [{ ...worksheetQuestion, answer: "" }, ...worksheet.questions.slice(1)] }).success, false);
});
test("worksheet multiple choice needs choices and other types cannot have them", () => {
  const mc = { prompt: "Pick.", type: "multiple_choice" as const, choices: ["A", "B"], answer: "A", workedSolution: "Because." };
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: [mc, ...worksheet.questions.slice(1)] }).success, true);
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: [{ ...mc, choices: undefined }, ...worksheet.questions.slice(1)] }).success, false);
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: [{ ...worksheetQuestion, choices: ["A", "B"] }, ...worksheet.questions.slice(1)] }).success, false);
  assert.equal(WorksheetContent.safeParse({ ...worksheet, questions: [{ ...mc, choices: ["A", "All of the above"] }, ...worksheet.questions.slice(1)] }).success, false);
});
test("worksheet answers list the answer and worked solution", () => {
  const key = worksheetAnswerKey(WorksheetContent.parse(worksheet));
  assert.ok(key.includes("1. 24\n4 groups of 6: 6 + 6 + 6 + 6 = 24."));
});

const vocabCard = { term: "fraction", studentFriendlyDefinition: "A part of a whole.", exampleSentence: "Half a pizza is a fraction of the pizza." };
test("vocabulary cards require 6 to 8 cards with term, definition and example", () => {
  assert.equal(VocabCardsContent.safeParse({ cards: Array.from({ length: 6 }, () => ({ ...vocabCard })) }).success, true);
  assert.equal(VocabCardsContent.safeParse({ cards: Array.from({ length: 5 }, () => ({ ...vocabCard })) }).success, false);
  assert.equal(VocabCardsContent.safeParse({ cards: Array.from({ length: 9 }, () => ({ ...vocabCard })) }).success, false);
  assert.equal(VocabCardsContent.safeParse({ cards: [{ ...vocabCard, exampleSentence: "" }, ...Array.from({ length: 5 }, () => ({ ...vocabCard }))] }).success, false);
});

const gameCard = { prompt: "What is 10 − 4?", answer: "6", workedSolution: "Count back 4 from 10: 9, 8, 7, 6." };
const game = {
  gameName: "Subtraction Scoot", format: "scoot" as const,
  materialsNeeded: ["Printed cards", "Pencils"], setup: "Place one card on each desk.",
  howToPlay: ["Students rotate desks.", "Answer each card."],
  cards: Array.from({ length: 10 }, () => ({ ...gameCard })),
  teacherNotes: "Watch for students who count on fingers.",
};
test("a game requires exactly 10 cards, a known format and teaching notes", () => {
  assert.equal(GameContent.safeParse(game).success, true);
  assert.equal(GameContent.safeParse({ ...game, cards: game.cards.slice(1) }).success, false);
  assert.equal(GameContent.safeParse({ ...game, format: "bingo" }).success, false);
  assert.equal(GameContent.safeParse({ ...game, teacherNotes: "" }).success, false);
});
test("Four Corners cards need exactly 4 choices", () => {
  const corners = { ...game, format: "four_corners" as const, cards: game.cards.map((c) => ({ ...c, choices: ["4", "5", "6", "7"] })) };
  assert.equal(GameContent.safeParse(corners).success, true);
  assert.equal(GameContent.safeParse({ ...corners, cards: [gameCard, ...corners.cards.slice(1)] }).success, false);
  assert.equal(GameContent.safeParse({ ...corners, cards: [{ ...corners.cards[0], choices: ["4", "5", "6"] }, ...corners.cards.slice(1)] }).success, false);
});
test("game answers list the answer and worked solution", () => {
  const key = gameAnswerKey(GameContent.parse(game));
  assert.ok(key.includes("1. 6\nCount back 4 from 10: 9, 8, 7, 6."));
});