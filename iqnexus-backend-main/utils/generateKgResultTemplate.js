import xlsx from "xlsx";
import { KG_PAPER_BY_CLASS } from "./kgScoringConfig.js";

/** Columns in the downloadable sample sheet (scoring pattern may use fewer/more) */
const TEMPLATE_RESPONSE_COLUMNS = 30;

/**
 * KG result response template: ROLL NO, ATTENDANCE, CLASS, SECTION, p1…p30
 * Actual scored questions / section marks come from the answer-key scoringPattern.
 */
export function generateKgResultTemplate() {
  const headers = [
    "ROLL NO",
    "ATTENDANCE",
    "CLASS",
    "SECTION",
    ...Array.from({ length: TEMPLATE_RESPONSE_COLUMNS }, (_, i) => `p${i + 1}`),
  ];

  const makeResponses = (count, pattern) => {
    const row = {};
    for (let i = 1; i <= TEMPLATE_RESPONSE_COLUMNS; i++) {
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
    { Instructions: "p1 … pN - Student answers (A or B). Q1…QN also accepted. Sample sheet has p1…p30." },
    { Instructions: "" },
    { Instructions: "SCORING PATTERN (configured on Answer Key upload, not here):" },
    { Instructions: "Admin defines 1…N sections with From Q / To Q / Marks per question." },
    { Instructions: "Only questions covered by that pattern are scored; extra p-columns are ignored." },
    { Instructions: "Default fallback if no pattern on key: NURSERY 20 / LKG 25 / UKG 30 with General+Achiever." },
    { Instructions: "" },
    { Instructions: "PREREQUISITE:" },
    { Instructions: "Upload the matching answer key (IQKD1/IQKD2 + class) WITH scoring pattern before responses." },
    { Instructions: "Delete sample rows before uploading real data." },
  ];
  const instructionSheet = xlsx.utils.json_to_sheet(instructionsData);
  instructionSheet["!cols"] = [{ wch: 72 }];
  xlsx.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

  return workbook;
}

export default generateKgResultTemplate;
