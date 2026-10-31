/**
 * Match KG student responses (p1…p30 / Q1…Q30) against an answer key
 * and emit the same section1–section5 + total shape used by result upload.
 */

import {
  getKgPaperConfig,
  kgMaxScore,
  KG_MAX_TEMPLATE_QUESTIONS,
} from "./kgScoringConfig.js";
import { normalizeKgClass } from "./kgHelpers.js";

const emptySection = () => ({
  score: 0,
  percentage: 0,
  correctCount: 0,
  totalCount: 0,
  unAttempted: 0,
});

/**
 * Detect whether an Excel row/header set is Q-response format.
 */
export function isKgResponseRow(rowOrColumns) {
  const keys = Array.isArray(rowOrColumns)
    ? rowOrColumns
    : Object.keys(rowOrColumns || {});
  return keys.some((k) => /^(p|q)\s*1$/i.test(String(k).trim()));
}

/**
 * Normalize stored answer-key `questions` object to { "1": "A", "2": "B", … }.
 * Accepts 0-based UI keys (AnswerKeyUpload) or 1-based keys.
 */
export function normalizeAnswerKeyMap(questions) {
  const map = {};
  if (!questions || typeof questions !== "object") return map;

  const keys = Object.keys(questions);
  const zeroBased = keys.some((k) => k === "0");

  for (const [rawKey, rawVal] of Object.entries(questions)) {
    let answer = rawVal;
    if (answer && typeof answer === "object") {
      answer = answer.answer ?? answer.value ?? answer.correct ?? "";
    }
    answer = String(answer ?? "")
      .trim()
      .toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) continue;

    const n = Number(rawKey);
    if (!Number.isFinite(n)) continue;
    const qNum = zeroBased ? n + 1 : n;
    if (qNum < 1 || qNum > KG_MAX_TEMPLATE_QUESTIONS) continue;
    map[String(qNum)] = answer;
  }
  return map;
}

function readResponse(row, qNum) {
  for (const [k, v] of Object.entries(row || {})) {
    if (new RegExp(`^(p|q)\\s*${qNum}$`, "i").test(String(k).trim())) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim().toUpperCase();
      }
    }
  }
  return "";
}

function pct(score, max) {
  if (!max || max <= 0) return 0;
  return Math.round((score / max) * 10000) / 100;
}

/**
 * Score one student response row.
 */
export function scoreKgRow({ row, answerKeyMap, classValue, attendance }) {
  const cls =
    normalizeKgClass(classValue) ||
    normalizeKgClass(row?.CLASS || row?.Class || row?.class) ||
    "UKG";
  const paper = getKgPaperConfig(cls);
  const maxTotal = kgMaxScore(cls);
  const att = String(attendance || "PRESENT").toUpperCase();

  const section1 = emptySection();
  const section5 = emptySection();
  section1.totalCount = paper.general.count;
  section5.totalCount = paper.achiever.count;

  const responses = {};
  let totalCorrect = 0;
  let totalUnattempted = 0;

  if (att === "ABSENT" || att === "DISQUALIFIED") {
    section1.unAttempted = paper.general.count;
    section5.unAttempted = paper.achiever.count;
    return {
      section1,
      section2: emptySection(),
      section3: emptySection(),
      section4: emptySection(),
      section5,
      total: {
        score: 0,
        rank: 0,
        percentage: 0,
        correctCount: 0,
        totalCount: paper.totalQuestions,
        unAttempted: paper.totalQuestions,
      },
      responses,
      meta: { class: cls, paper, maxTotal, mode: "absent" },
    };
  }

  for (let q = 1; q <= paper.totalQuestions; q++) {
    const studentAns = readResponse(row, q);
    responses[`p${q}`] = studentAns || "";
    const correctAns = answerKeyMap[String(q)];
    const isGeneral = q <= paper.general.count;
    const marks = isGeneral
      ? paper.general.marksPerQuestion
      : paper.achiever.marksPerQuestion;
    const sec = isGeneral ? section1 : section5;

    if (!studentAns) {
      sec.unAttempted += 1;
      totalUnattempted += 1;
      continue;
    }

    if (correctAns && studentAns === correctAns) {
      sec.correctCount += 1;
      sec.score += marks;
      totalCorrect += 1;
    }
  }

  const generalMax = paper.general.count * paper.general.marksPerQuestion;
  const achieverMax = paper.achiever.count * paper.achiever.marksPerQuestion;
  section1.percentage = pct(section1.score, generalMax);
  section5.percentage = pct(section5.score, achieverMax);

  const totalScore = section1.score + section5.score;
  return {
    section1,
    section2: emptySection(),
    section3: emptySection(),
    section4: emptySection(),
    section5,
    total: {
      score: totalScore,
      rank: 0,
      percentage: pct(totalScore, maxTotal),
      correctCount: totalCorrect,
      totalCount: paper.totalQuestions,
      unAttempted: totalUnattempted,
    },
    responses,
    meta: { class: cls, paper, maxTotal, mode: "scored" },
  };
}
