import {
  SECTION_KEYS,
  SECTION_LABELS,
  VERIFY_NOTE,
  isTimed,
  lessonFilename,
  metaLine,
  sectionText,
  visibleStandard,
  type LessonMeta,
  type LessonPlanData,
} from "./lesson-schema";
import { APP_CONFIG } from "@/config/app-config";

/** Builds a Word document in the browser and triggers a download. */
export async function downloadLessonDocx(plan: LessonPlanData, meta: LessonMeta) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const body = (text: string) =>
    text.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 80 } }));

  const children = [
    new Paragraph({ text: plan.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: metaLine(meta), italics: true })], spacing: { after: 240 } }),
  ];
  const std = visibleStandard(plan);
  if (std) {
    children.push(new Paragraph({ text: "Standard", heading: HeadingLevel.HEADING_1, spacing: { before: 240 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: std.code, bold: true })] }));
    children.push(...body(std.standardText));
    if (std.notes) children.push(...body(std.notes));
    if (std.sourceUrl) children.push(...body(std.sourceUrl));
    children.push(new Paragraph({ children: [new TextRun({ text: APP_CONFIG.standards.copyrightNotice, italics: true, size: 18 })] }));
  }
  for (const key of SECTION_KEYS) {
    const heading = isTimed(key) ? `${SECTION_LABELS[key]} (${plan[key].minutes} min)` : SECTION_LABELS[key];
    children.push(new Paragraph({ text: heading, heading: HeadingLevel.HEADING_1, spacing: { before: 240 } }));
    children.push(...body(sectionText(plan, key)));
  }
  children.push(
    new Paragraph({ children: [new TextRun({ text: VERIFY_NOTE, italics: true })], spacing: { before: 360 } }),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = lessonFilename(plan.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
