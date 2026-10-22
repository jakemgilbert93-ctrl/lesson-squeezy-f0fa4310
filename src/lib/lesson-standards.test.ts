import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function expect(actual: unknown) {
  const contains = (value: unknown) => Array.isArray(actual) ? actual.includes(value) : typeof actual === "string" && actual.includes(String(value));
  return {
    toBe: (value: unknown) => assert.equal(actual, value),
    toBeNull: () => assert.equal(actual, null),
    toContain: (value: unknown) => assert.ok(contains(value)),
    not: { toContain: (value: unknown) => assert.ok(!contains(value)) },
  };
}
import { standardsSubjectFor } from "../config/app-config";
import { enteredStandard, lessonToPlainText, normalizeLesson, standardOnlineUrl, standardsSourceUrl, visibleStandard, type LessonPlanData } from "./lesson-schema";
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
  const proc = spawnSync("python3", ["-c", `import sys,io,zipfile,json,xml.etree.ElementTree as E
root=E.fromstring(zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())).read('word/document.xml'))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
print(json.dumps([''.join(p.itertext()) for p in root.findall('.//w:p',ns)]))`],
    { input: Buffer.from(await blob.arrayBuffer()) });
  expect(proc.status).toBe(0);
  return JSON.parse(proc.stdout.toString());
}
/** Hyperlink targets are stored in the document's relationships, not its visible text. */
async function documentLinks(plan: LessonPlanData): Promise<string[]> {
  const blob = await createLessonDocx(plan, meta);
  const proc = spawnSync("python3", ["-c", `import sys,io,zipfile,json,xml.etree.ElementTree as E
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
root=E.fromstring(z.read('word/_rels/document.xml.rels'))
print(json.dumps([r.get('Target') for r in root.iter() if r.get('Target')]))`],
    { input: Buffer.from(await blob.arrayBuffer()) });
  expect(proc.status).toBe(0);
  return JSON.parse(proc.stdout.toString());
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
    expect(paragraphs).toContain(`${standard.code} — Verified standard · Common Core State Standards`);
    for (const line of standard.standardText.split("\n")) expect(paragraphs).toContain(line);
  });
  test("verified standards link online and to the subject PDF", async () => {
    const MATH_PDF = "https://corestandards.org/wp-content/uploads/2023/09/Math_Standards1.pdf";
    const ELA_PDF = "https://corestandards.org/wp-content/uploads/2023/09/ELA_Standards1.pdf";
    const LABEL = "Official PDF";
    const NOTE = "Reference links may change or go out of date. Please confirm the standard in the official PDF or your state's standards.";
    const snap = (ccssId: string) => ({ ccssId, code: "", standardText: "", notes: null, sourceUrl: null });
    expect(standardOnlineUrl(snap("CCSS.Math.Content.4.NF.B.3"))).toBe("https://thecorestandards.org/Math/Content/4/NF/#CCSS.Math.Content.4.NF.B.3");
    expect(standardOnlineUrl(snap("CCSS.Math.Content.K.CC.A.1"))).toBe("https://thecorestandards.org/Math/Content/K/CC/#CCSS.Math.Content.K.CC.A.1");
    expect(standardOnlineUrl(snap("CCSS.ELA-Literacy.RL.K.1"))).toBe("https://www.thecorestandards.org/ELA-Literacy/RL/K/1/");
    const mathPlan = normalizeLesson({ ...base, standard });
    expect(standardsSourceUrl(visibleStandard(mathPlan)!)).toBe(MATH_PDF);
    expect(lessonToPlainText(mathPlan, meta)).toContain(`${LABEL}: ${MATH_PDF}`);
    expect(lessonToPlainText(mathPlan, meta)).toContain(NOTE);
    const mathParagraphs = await documentParagraphs(mathPlan);
    expect(mathParagraphs).toContain(LABEL);
    expect(mathParagraphs).toContain(NOTE);
    const mathLinks = await documentLinks(mathPlan);
    expect(mathLinks).toContain(MATH_PDF);
    expect(mathLinks.join(" ")).toContain("thecorestandards.org/Math/Content/");
    const elaPlan = normalizeLesson({ ...base, standard: {
      ccssId: "CCSS.ELA-Literacy.RL.4.1", code: "RL.4.1",
      standardText: "Refer to details and examples in a text.", notes: null, sourceUrl: null,
    } });
    expect(standardsSourceUrl(visibleStandard(elaPlan)!)).toBe(ELA_PDF);
    expect(lessonToPlainText(elaPlan, meta)).toContain(`${LABEL}: ${ELA_PDF}`);
    const elaParagraphs = await documentParagraphs(elaPlan);
    expect(elaParagraphs).toContain(LABEL);
    const elaLinks = await documentLinks(elaPlan);
    expect(elaLinks).toContain(ELA_PDF);
    expect(elaLinks).toContain("https://www.thecorestandards.org/ELA-Literacy/RL/4/1/");
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
    expect(lessonToPlainText(plan, meta)).not.toContain("Reference links");
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