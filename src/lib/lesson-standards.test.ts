import { describe, expect, test } from "bun:test";
import { standardsSubjectFor } from "../config/app-config";
import { enteredStandard, lessonToPlainText, normalizeLesson, visibleStandard, type LessonPlanData } from "./lesson-schema";
import { createLessonDocx } from "./lesson-docx";
import standard from "./home-sample-standard.json";

const base: LessonPlanData = {
  title: "Standards test", objective: "Students explore the topic. Students explain their reasoning.",
  materials: "Paper\nPencils", warmUp: { minutes: 5, content: "Review." },
  directInstruction: { minutes: 15, content: "Model." }, practice: { minutes: 25, content: "Practice." },
  exitTicket: "Explain.", differentiation: "Provide support.",
};
const meta = { grade: "4", subject: "Math", durationMin: 45 };
async function documentParagraphs(plan: LessonPlanData): Promise<string[]> {
  const blob = await createLessonDocx(plan, meta);
  const proc = Bun.spawn(["python3", "-c", `import sys,io,zipfile,json,xml.etree.ElementTree as E
root=E.fromstring(zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())).read('word/document.xml'))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
print(json.dumps([''.join(p.itertext()) for p in root.findall('.//w:p',ns)]))`],
    { stdin: new Uint8Array(await blob.arrayBuffer()), stdout: "pipe", stderr: "pipe" });
  const output = await new Response(proc.stdout).text();
  expect(await proc.exited).toBe(0);
  return JSON.parse(output);
}
describe("standards provenance", () => {
  test("Grade 4 Math uses verified standards", () => expect(standardsSubjectFor("4", "Math")).toBe("Math"));
  test("Grade 4 ELA uses verified standards", () => expect(standardsSubjectFor("4", "English Language Arts")).toBe("ELA"));
  test("Grade 7 Science has no verified set", () => expect(standardsSubjectFor("7", "Science")).toBeNull());
  test("verified text remains exact, including all subpart line breaks in clipboard and Word", async () => {
    const plan = normalizeLesson({ ...base, standard });
    expect(visibleStandard(plan)?.standardText).toBe(standard.standardText);
    expect(lessonToPlainText(plan, meta)).toContain(standard.standardText);
    expect(lessonToPlainText(plan, meta)).toContain(`${standard.code} — Verified standard`);
    const paragraphs = await documentParagraphs(plan);
    expect(paragraphs).toContain(`${standard.code} — Verified standard`);
    for (const line of standard.standardText.split("\n")) expect(paragraphs).toContain(line);
  });
  test("teacher text stays verbatim in saved shape, clipboard and Word, without verified/source metadata", async () => {
    const text = "  Explain changes in energy.\nUse evidence from an investigation.  ";
    const plan = normalizeLesson({ ...base, teacherStandard: text });
    expect(enteredStandard(plan)).toBe(text);
    expect(visibleStandard(plan)).toBeNull();
    expect(lessonToPlainText(plan, meta)).toContain(`Standard (entered by you)\n${text}`);
    const paragraphs = await documentParagraphs(plan);
    expect(paragraphs).toContain("Standard (entered by you)");
    for (const line of text.split("\n")) expect(paragraphs).toContain(line);
    expect(paragraphs.join("\n")).not.toContain("Verified standard");
    expect(paragraphs.join("\n")).not.toContain("corestandards.org");
  });
  test("blank teacher standard produces no standards section in clipboard or Word", async () => {
    const plan = normalizeLesson({ ...base, teacherStandard: " \n " });
    expect(enteredStandard(plan)).toBeNull();
    expect(lessonToPlainText(plan, meta)).not.toContain("STANDARD\n");
    expect(lessonToPlainText(plan, meta)).not.toContain("Standard (entered by you)");
    const paragraphs = await documentParagraphs(plan);
    expect(paragraphs).not.toContain("Standard");
    expect(paragraphs).not.toContain("Standard (entered by you)");
  });
});