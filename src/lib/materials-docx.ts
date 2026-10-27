import { z } from "zod";
import { APP_CONFIG, gradeLabel } from "@/config/app-config";
import {
  ExitTicketContent, GameContent, QuizContent, VocabCardsContent, WorksheetContent, type MaterialItemType,
} from "./materials-schema";

export type MaterialDocInput = {
  itemType: MaterialItemType;
  itemTitle: string;
  content: unknown;
  lessonTitle: string;
  grade: string | null;
  /** True when the lesson shows a verified standard, matching the lesson file footer. */
  withStandardsFooter: boolean;
};
export type MaterialCopy = "student" | "key";

const letter = (i: number) => String.fromCharCode(65 + i);
export const MATERIAL_LABEL: Record<MaterialItemType, string> = {
  exit_ticket: "Exit Ticket", quiz: "Quiz", worksheet: "Worksheet", vocab_cards: "Vocabulary Cards", game: "Game",
};
const LABEL = MATERIAL_LABEL;

export const GAME_FORMAT_LABEL: Record<z.infer<typeof GameContent>["format"], string> = {
  scoot: "Scoot", around_the_world: "Around the World", four_corners: "Four Corners", team_relay: "Team Relay",
};

/** Which downloads each item type offers, with button labels. Vocabulary cards have no answer key. */
export function materialDownloads(type: MaterialItemType): { copy: MaterialCopy; label: string }[] {
  if (type === "vocab_cards") return [{ copy: "student", label: "Student copy" }];
  if (type === "game") return [{ copy: "student", label: "Student cards" }, { copy: "key", label: "Teacher guide" }];
  return [{ copy: "student", label: "Student copy" }, { copy: "key", label: "Answer key" }];
}

/** Plain-text versions used by the Copy button (student or teacher view). */
export function materialToText(input: Pick<MaterialDocInput, "itemType" | "itemTitle" | "content">, copy: MaterialCopy): string {
  const lines = [input.itemTitle, ""];
  const t = input.itemType;
  if (t === "quiz") {
    const c = QuizContent.parse(input.content);
    if (copy === "student") lines.push(c.directions, "");
    c.questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.prompt}`);
      if (copy === "student") q.choices.forEach((ch, j) => lines.push(`   ${letter(j)}. ${ch}`));
      else lines.push(`   Answer: ${letter(q.correctIndex)}. ${q.choices[q.correctIndex]}`, `   ${q.workedSolution}`);
      lines.push("");
    });
  } else if (t === "worksheet") {
    const c = WorksheetContent.parse(input.content);
    lines.push(c.directions, "");
    c.questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.prompt}`);
      q.choices?.forEach((ch, j) => lines.push(`   ${letter(j)}. ${ch}`));
      if (copy === "key") lines.push(`   Answer: ${q.answer}`, `   ${q.workedSolution}`);
      lines.push("");
    });
  } else if (t === "vocab_cards") {
    const c = VocabCardsContent.parse(input.content);
    c.cards.forEach((v) => {
      lines.push(v.term, `Definition: ${v.studentFriendlyDefinition}`, `Example: ${v.exampleSentence}`);
      if (v.memoryHint) lines.push(`Hint: ${v.memoryHint}`);
      lines.push("");
    });
  } else if (t === "game") {
    const c = GameContent.parse(input.content);
    lines.push(`${c.gameName} (${GAME_FORMAT_LABEL[c.format]})`, "");
    if (copy === "key") {
      lines.push("Materials", ...c.materialsNeeded.map((m) => `- ${m}`), "", "Setup", c.setup, "",
        "How to play", ...c.howToPlay.map((s, i) => `${i + 1}. ${s}`), "", "Teacher notes", c.teacherNotes, "");
    }
    c.cards.forEach((card, i) => {
      lines.push(`Card ${i + 1}: ${card.prompt}`);
      card.choices?.forEach((ch, j) => lines.push(`   ${letter(j)}. ${ch}`));
      if (copy === "key") lines.push(`   Answer: ${card.answer}`, `   ${card.workedSolution}`);
      lines.push("");
    });
  } else {
    const c = ExitTicketContent.parse(input.content);
    if (copy === "student") {
      lines.push(c.directions, "");
      c.questions.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.prompt}`);
        q.choices?.forEach((ch, j) => lines.push(`   ${letter(j)}. ${ch}`));
        lines.push("");
      });
    } else lines.push("Teacher notes", c.teacherNotes || "—");
  }
  return lines.join("\n").trim();
}

/** Builds one Word file: the student copy never contains answers, solutions or teacher notes. */
export async function createMaterialDocx(input: MaterialDocInput, copy: MaterialCopy) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Footer, Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import("docx");
  type P = InstanceType<typeof Paragraph>;
  const p = (text: string, opts: { bold?: boolean; italics?: boolean; after?: number; indent?: number } = {}) =>
    new Paragraph({
      children: [new TextRun({ text, bold: opts.bold ?? false, italics: opts.italics ?? false })],
      spacing: { after: opts.after ?? 80 },
      ...(opts.indent ? { indent: { left: opts.indent } } : {}),
    });
  const body = (text: string) => text.split("\n").map((l) => p(l));
  const answerLine = () => p("_".repeat(70), { after: 160 });
  const h1 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
  const border = { style: BorderStyle.DASHED, size: 8, color: "666666" };
  /** Cut-out grid: each card is a bordered cell. */
  const cardGrid = (cards: P[][], cols: number) => {
    const rows: InstanceType<typeof TableRow>[] = [];
    for (let i = 0; i < cards.length; i += cols) {
      const cells = Array.from({ length: cols }, (_, k) => new TableCell({
        children: cards[i + k] ?? [p("")],
        width: { size: Math.floor(100 / cols), type: WidthType.PERCENTAGE },
        margins: { top: 160, bottom: 160, left: 160, right: 160 },
        borders: { top: border, bottom: border, left: border, right: border },
      }));
      rows.push(new TableRow({ children: cells, cantSplit: true }));
    }
    return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
  };

  const t = input.itemType;
  const keyLabel = t === "game" ? "Teacher guide" : "Answer key";
  const studentLabel = t === "game" ? "Student cards" : "Student copy";
  const heading = `${LABEL[t]} — ${copy === "key" ? keyLabel : studentLabel}`;
  const children: (P | InstanceType<typeof Table>)[] = [
    new Paragraph({ text: input.itemTitle, heading: HeadingLevel.TITLE }),
    p(`${heading} · ${input.lessonTitle} · ${gradeLabel(input.grade ?? "")}`, { italics: true, after: 240 }),
  ];

  if (copy === "student" && t !== "game" && t !== "vocab_cards") {
    children.push(p("Name: ______________________________    Date: ______________", { after: 240 }));
  }

  if (t === "quiz") {
    const c = QuizContent.parse(input.content);
    if (copy === "student") children.push(p(c.directions, { bold: true, after: 200 }));
    c.questions.forEach((q, i) => {
      children.push(p(`${i + 1}. ${q.prompt}`, { bold: true }));
      if (copy === "student") {
        q.choices.forEach((ch, j) => children.push(p(`${letter(j)}. ${ch}`, { indent: 360 })));
      } else {
        children.push(p(`Correct answer: ${letter(q.correctIndex)}. ${q.choices[q.correctIndex]}`, { indent: 360 }));
        children.push(...body(q.workedSolution));
      }
      children.push(p("", { after: 120 }));
    });
  } else if (t === "worksheet") {
    const c = WorksheetContent.parse(input.content);
    children.push(p(c.directions, { bold: true, after: 200 }));
    c.questions.forEach((q, i) => {
      children.push(p(`${i + 1}. ${q.prompt}`, { bold: true }));
      if (q.choices?.length) q.choices.forEach((ch, j) => children.push(p(`${letter(j)}. ${ch}`, { indent: 360 })));
      if (copy === "student") {
        if (!q.choices?.length) for (let n = 0; n < (q.answerLines ?? 3); n++) children.push(answerLine());
      } else {
        children.push(p(`Answer: ${q.answer}`, { indent: 360 }));
        children.push(...body(q.workedSolution));
      }
      children.push(p("", { after: 120 }));
    });
  } else if (t === "vocab_cards") {
    const c = VocabCardsContent.parse(input.content);
    children.push(p("Cut along the dashed lines.", { italics: true, after: 200 }));
    children.push(cardGrid(c.cards.map((v) => [
      p(v.term, { bold: true, after: 120 }),
      p(v.studentFriendlyDefinition),
      p(`Example: ${v.exampleSentence}`, { italics: true }),
      ...(v.memoryHint ? [p(`Hint: ${v.memoryHint}`)] : []),
    ]), 2));
  } else if (t === "game") {
    const c = GameContent.parse(input.content);
    children.push(p(`${c.gameName} · ${GAME_FORMAT_LABEL[c.format]}`, { bold: true, after: 200 }));
    if (copy === "student") {
      children.push(p("Cut along the dashed lines.", { italics: true, after: 200 }));
      children.push(cardGrid(c.cards.map((card, i) => [
        p(`Card ${i + 1}`, { bold: true }),
        p(card.prompt),
        ...(card.choices ?? []).map((ch, j) => p(`${letter(j)}. ${ch}`, { indent: 240 })),
      ]), 2));
    } else {
      children.push(h1("Format"), p(GAME_FORMAT_LABEL[c.format]));
      children.push(h1("Materials"), ...c.materialsNeeded.map((m) => p(`• ${m}`)));
      children.push(h1("Setup"), ...body(c.setup));
      children.push(h1("How to play"), ...c.howToPlay.map((s, i) => p(`${i + 1}. ${s}`)));
      children.push(h1("Teacher notes"), ...body(c.teacherNotes));
      children.push(h1("Cards and answers"));
      c.cards.forEach((card, i) => {
        children.push(p(`Card ${i + 1}: ${card.prompt}`, { bold: true }));
        card.choices?.forEach((ch, j) => children.push(p(`${letter(j)}. ${ch}`, { indent: 360 })));
        children.push(p(`Answer: ${card.answer}`, { indent: 360 }), ...body(card.workedSolution), p("", { after: 120 }));
      });
    }
  } else {
    const c: z.infer<typeof ExitTicketContent> = ExitTicketContent.parse(input.content);
    if (copy === "student") {
      children.push(p(c.directions, { bold: true, after: 200 }));
      c.questions.forEach((q, i) => {
        children.push(p(`${i + 1}. ${q.prompt}`, { bold: true }));
        if (q.choices?.length) q.choices.forEach((ch, j) => children.push(p(`${letter(j)}. ${ch}`, { indent: 360 })));
        else for (let n = 0; n < (q.answerLines ?? 3); n++) children.push(answerLine());
        children.push(p("", { after: 120 }));
      });
    } else {
      children.push(h1("Teacher notes"));
      children.push(...body(c.teacherNotes || "—"));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      ...(input.withStandardsFooter
        ? { footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: APP_CONFIG.standards.copyrightNotice, size: 16 })] })] }) } }
        : {}),
      children,
    }],
  });
  return Packer.toBlob(doc);
}

export function materialFilename(input: Pick<MaterialDocInput, "itemType" | "lessonTitle">, copy: MaterialCopy) {
  const suffix = input.itemType === "game" ? (copy === "key" ? "Teacher Guide" : "Student Cards") : copy === "key" ? "Answer Key" : "Student";
  const base = `${input.lessonTitle} ${LABEL[input.itemType]} ${suffix}`
    .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
  return `${base || "material"}.docx`;
}

export async function downloadMaterialDocx(input: MaterialDocInput, copy: MaterialCopy) {
  const blob = await createMaterialDocx(input, copy);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = materialFilename(input, copy);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
