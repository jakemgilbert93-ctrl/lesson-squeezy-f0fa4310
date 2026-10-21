import {
  SECTION_KEYS,
  SECTION_LABELS,
  VERIFY_NOTE,
  isTimed,
  lessonFilename,
  metaLine,
  sectionText,
  visibleStandard,
  enteredStandard,
  STANDARDS_SOURCE_LABEL,
  standardsSourceUrl,
  STANDARD_ONLINE_LABEL,
  STANDARD_LINK_NOTE,
  standardOnlineUrl,
  type LessonMeta,
  type LessonPlanData,
} from "./lesson-schema";
import { APP_CONFIG } from "@/config/app-config";

/** Builds a Word document in the browser and triggers a download. */
export async function createLessonDocx(plan: LessonPlanData, meta: LessonMeta) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, Footer } = await import("docx");

  const body = (text: string) =>
    text.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 80 } }));

  const children = [
    new Paragraph({ text: plan.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: metaLine(meta), italics: true })], spacing: { after: 240 } }),
  ];
  const std = visibleStandard(plan);
  if (std) {
    children.push(new Paragraph({ text: "Standard", heading: HeadingLevel.HEADING_1, spacing: { before: 240 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${std.code} — Verified standard · Common Core State Standards`, bold: true })] }));
    children.push(...body(std.standardText));
    if (std.notes) children.push(...body(std.notes));
    const online = standardOnlineUrl(std);
    if (online) {
      children.push(new Paragraph({ children: [new ExternalHyperlink({ link: online, children: [new TextRun({ text: STANDARD_ONLINE_LABEL, style: "Hyperlink" })] })] }));
    }
    const url = standardsSourceUrl(std);
    if (url) {
      children.push(new Paragraph({ children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: STANDARDS_SOURCE_LABEL, style: "Hyperlink", size: 18 })] })] }));
    }
    if (online || url) {
      children.push(new Paragraph({ children: [new TextRun({ text: STANDARD_LINK_NOTE, italics: true, size: 18, color: "6B6B6B" })] }));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: APP_CONFIG.standards.copyrightNotice, italics: true, size: 18 })] }));
  }
  const entered = enteredStandard(plan);
  if (entered) {
    children.push(new Paragraph({ text: "Standard (entered by you)", heading: HeadingLevel.HEADING_1, spacing: { before: 240 } }));
    children.push(...body(entered));
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
        ...(std
          ? { footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: APP_CONFIG.standards.copyrightNotice, size: 16 })] })] }) } }
          : {}),
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadLessonDocx(plan: LessonPlanData, meta: LessonMeta) {
  const blob = await createLessonDocx(plan, meta);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = lessonFilename(plan.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
