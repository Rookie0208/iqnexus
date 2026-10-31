import xlsx from "xlsx";
import { KG_MAX_TEMPLATE_QUESTIONS, KG_PAPER_BY_CLASS } from "./kgScoringConfig.js";

/**
 * KG result response template: ROLL NO, ATTENDANCE, CLASS, SECTION, p1…p30
 */
export function generateKgResultTemplate() {
  const headers = [
    "ROLL NO",
    "ATTENDANCE",
    "CLASS",
    "SECTION",
    ...Array.from({ length: KG_MAX_TEMPLATE_QUESTIONS }, (_, i) => `p${i + 1}`),
  ];

  const makeResponses = (count, pattern) => {
    const row = {};
    for (let i = 1; i <= KG_MAX_TEMPLATE_QUESTIONS; i++) {
      row[`p${i}`] = i <= count ? pattern[(i - 1) % pattern.length] : "";
    }
    return row;
  };

  const sampleData = [
    {
      "ROLL NO": "11000101",
      ATTENDANCE: "PRESENT",
      CLASS: "NURSERY",
      SECTION: "A",
      ...makeResponses(KG_PAPER_BY_CLASS.NURSERY.totalQuestions, ["A", "B"]),
    },
    {
      "ROLL NO": "11000201",
      ATTENDANCE: "PRESENT",
      CLASS: "LKG",
      SECTION: "B",
      ...makeResponses(KG_PAPER_BY_CLASS.LKG.totalQuestions, ["B", "A"]),
    },
    {
      "ROLL NO": "11000301",
      ATTENDANCE: "PRESENT",
      CLASS: "UKG",
      SECTION: "A",
      ...makeResponses(KG_PAPER_BY_CLASS.UKG.totalQuestions, ["A", "A", "B"]),
    },
    {
      "ROLL NO": "11000401",
      ATTENDANCE: "ABSENT",
      CLASS: "UKG",
      SECTION: "A",
      ...makeResponses(0, []),
    },
  ];

  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(sampleData, { header: headers });
  worksheet["!cols"] = headers.map((h) => ({
    wch: Math.max(String(h).length + 2, 8),
  }));
  xlsx.utils.book_append_sheet(workbook, worksheet, "KG Responses");

  const instructionsData = [
    { Instructions: "KG RESULT UPLOAD TEMPLATE (Q-RESPONSE / AUTO-SCORE)" },
    { Instructions: "" },
    { Instructions: "COLUMNS:" },
    { Instructions: "ROLL NO - Student roll number (required)" },
    { Instructions: "ATTENDANCE - PRESENT | ABSENT | DISQUALIFIED (required)" },
    { Instructions: "CLASS - NURSERY | LKG | UKG (PG → NURSERY)" },
    { Instructions: "SECTION - School section A/B/C…" },
    { Instructions: "p1 … p30 - Student answers (A or B). Q1…Q30 also accepted." },
    { Instructions: "" },
    { Instructions: "QUESTION COUNTS (extra columns ignored):" },
    { Instructions: "NURSERY (PG) - first 20 questions scored" },
    { Instructions: "LKG - first 25 questions scored" },
    { Instructions: "UKG - all 30 questions scored" },
    { Instructions: "" },
    { Instructions: "MARKS:" },
    { Instructions: "General section (earlier questions) - 1 mark each → stored as section1" },
    { Instructions: "Achiever section (last 5 questions) - 2 marks each → stored as section5" },
    { Instructions: "" },
    { Instructions: "PREREQUISITE:" },
    { Instructions: "Upload the matching answer key (IQKD1/IQKD2 + class) before uploading responses." },
    { Instructions: "Delete sample rows before uploading real data." },
  ];
  const instructionSheet = xlsx.utils.json_to_sheet(instructionsData);
  instructionSheet["!cols"] = [{ wch: 72 }];
  xlsx.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

  return workbook;
}

export default generateKgResultTemplate;
