import { z } from "zod";
import { APP_CONFIG, gradeLabel } from "@/config/app-config";
import { ExitTicketContent, QuizContent, type MaterialItemType } from "./materials-schema";

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
const LABEL: Record<MaterialItemType, string> = { exit_ticket: "Exit Ticket", quiz: "Quiz" };

/** Plain-text versions used by the Copy button (student or teacher view). */
export function materialToText(input: Pick<MaterialDocInput, "itemType" | "itemTitle" | "content">, copy: MaterialCopy): string {
  const lines = [input.itemTitle, ""];
  if (input.itemType === "quiz") {
    const c = QuizContent.parse(input.content);
    if (copy === "student") lines.push(c.directions, "");
    c.questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.prompt}`);
      if (copy === "student") q.choices.forEach((ch, j) => lines.push(`   ${letter(j)}. ${ch}`));
      else lines.push(`   Answer: ${letter(q.correctIndex)}. ${q.choices[q.correctIndex]}`, `   ${q.workedSolution}`);
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

/** Builds one Word file: the student copy never contains answers. */
export async function createMaterialDocx(input: MaterialDocInput, copy: MaterialCopy) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Footer } = await import("docx");
  const p = (text: string, opts: { bold?: boolean; italics?: boolean; after?: number; indent?: number } = {}) =>
    new Paragraph({
      children: [new TextRun({ text, bold: opts.bold ?? false, italics: opts.italics ?? false })],
      spacing: { after: opts.after ?? 80 },
      ...(opts.indent ? { indent: { left: opts.indent } } : {}),
    });
  const body = (text: string) => text.split("\n").map((l) => p(l));
  const answerLine = () => p("_".repeat(70), { after: 160 });

  const heading = `${LABEL[input.itemType]}${copy === "key" ? " — Answer key" : ""}`;
  const children = [
    new Paragraph({ text: input.itemTitle, heading: HeadingLevel.TITLE }),
    p(`${heading} · ${input.lessonTitle} · ${gradeLabel(input.grade ?? "")}`, { italics: true, after: 240 }),
  ];

  if (copy === "student") {
    children.push(p("Name: ______________________________    Date: ______________", { after: 240 }));
  }

  if (input.itemType === "quiz") {
    const c = QuizContent.parse(input.content);
    if (copy === "student") children.push(p(c.directions, { bold: true, after: 200 }));
    c.questions.forEach((q, i) => {
      children.push(p(`${i + 1}. ${q.prompt}`, { bold: true }));
      if (copy === "student") {
        q.choices.forEach((ch, j) => children.push(p(`${letter(j)}. ${ch}`, { indent: 360 })));
      } else {
        children.push(p(`Correct answer: ${letter(q.correctIndex)}. ${q.choices[q.correctIndex]}`, { indent: 360 }));
        children.push(...body(q.workedSolution).map((x) => x));
      }
      children.push(p("", { after: 120 }));
    });
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
      children.push(new Paragraph({ text: "Teacher notes", heading: HeadingLevel.HEADING_1 }));
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
  const base = `${input.lessonTitle} ${LABEL[input.itemType]} ${copy === "key" ? "Answer Key" : "Student"}`
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
