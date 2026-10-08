import {
  SECTION_KEYS,
  SECTION_LABELS,
  VERIFY_NOTE,
  isTimed,
  lessonFilename,
  metaLine,
  sectionText,
  type LessonMeta,
  type LessonPlanData,
} from "./lesson-schema";

/** Builds a Word document in the browser and triggers a download. */
export async function downloadLessonDocx(plan: LessonPlanData, meta: LessonMeta) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const body = (text: string) =>
    text.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 80 } }));

  const children = [
    new Paragraph({ text: plan.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: metaLine(meta), italics: true })], spacing: { after: 240 } }),
  ];
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
