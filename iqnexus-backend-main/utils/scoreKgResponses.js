/**
 * Match KG student responses (p1…pN / Q1…QN) against an answer key
 * and emit sections[] (1…N) plus legacy section1–section5 dual-write fields.
 */

import {
  KG_MAX_TEMPLATE_QUESTIONS,
  resolveScoringPattern,
  patternMaxScore,
} from "./kgScoringConfig.js";
import { normalizeKgClass } from "./kgHelpers.js";
import { sectionsToLegacyFields } from "./resultSections.js";

const emptySectionStats = () => ({
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

function findSectionForQuestion(pattern, q) {
  return pattern.sections.find((s) => q >= s.from && q <= s.to) || null;
}

/**
 * Score one student response row.
 * @param {object} opts
 * @param {object} opts.row - Excel row
 * @param {object} opts.answerKeyMap - { "1": "A", ... }
 * @param {string} opts.classValue
 * @param {string} opts.attendance
 * @param {object|null} opts.scoringPattern - optional user pattern from answer key
 */
export function scoreKgRow({
  row,
  answerKeyMap,
  classValue,
  attendance,
  scoringPattern = null,
}) {
  const cls =
    normalizeKgClass(classValue) ||
    normalizeKgClass(row?.CLASS || row?.Class || row?.class) ||
    "UKG";
  const pattern = resolveScoringPattern(scoringPattern, cls);
  const maxTotal = patternMaxScore(pattern);
  const att = String(attendance || "PRESENT").toUpperCase();

  const sectionStats = pattern.sections.map((s) => ({
    index: s.index,
    label: s.label,
    isAchiever: Boolean(s.isAchiever),
    from: s.from,
    to: s.to,
    marksPerQuestion: s.marksPerQuestion,
    maxScore: (s.to - s.from + 1) * s.marksPerQuestion,
    ...emptySectionStats(),
    totalCount: s.to - s.from + 1,
  }));

  const byIndex = new Map(sectionStats.map((s) => [s.index, s]));
  const responses = {};
  let totalCorrect = 0;
  let totalUnattempted = 0;

  if (att === "ABSENT" || att === "DISQUALIFIED") {
    for (const sec of sectionStats) {
      sec.unAttempted = sec.totalCount;
      sec.percentage = 0;
    }
    const sections = sectionStats.map((s) => ({
      index: s.index,
      label: s.label,
      isAchiever: s.isAchiever,
      score: 0,
      percentage: 0,
      correctCount: 0,
      totalCount: s.totalCount,
      unAttempted: s.totalCount,
      maxScore: s.maxScore,
    }));
    const legacy = sectionsToLegacyFields(sections);
    return {
      sections,
      scoringPattern: pattern,
      ...legacy,
      total: {
        score: 0,
        rank: 0,
        percentage: 0,
        correctCount: 0,
        totalCount: pattern.totalQuestions,
        unAttempted: pattern.totalQuestions,
      },
      responses,
      meta: { class: cls, pattern, maxTotal, mode: "absent" },
    };
  }

  for (let q = 1; q <= pattern.totalQuestions; q++) {
    const studentAns = readResponse(row, q);
    responses[`p${q}`] = studentAns || "";
    const def = findSectionForQuestion(pattern, q);
    if (!def) continue;
    const sec = byIndex.get(def.index);
    if (!sec) continue;

    const correctAns = answerKeyMap[String(q)];
    const marks = def.marksPerQuestion;

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

  for (const sec of sectionStats) {
    sec.percentage = pct(sec.score, sec.maxScore);
  }

  const sections = sectionStats.map((s) => ({
    index: s.index,
    label: s.label,
    isAchiever: s.isAchiever,
    score: s.score,
    percentage: s.percentage,
    correctCount: s.correctCount,
    totalCount: s.totalCount,
    unAttempted: s.unAttempted,
    maxScore: s.maxScore,
  }));

  const totalScore = sections.reduce((sum, s) => sum + s.score, 0);
  const legacy = sectionsToLegacyFields(sections);

  return {
    sections,
    scoringPattern: pattern,
    ...legacy,
    total: {
      score: totalScore,
      rank: 0,
      percentage: pct(totalScore, maxTotal),
      correctCount: totalCorrect,
      totalCount: pattern.totalQuestions,
      unAttempted: totalUnattempted,
    },
    responses,
    meta: { class: cls, pattern, maxTotal, mode: "scored" },
  };
}
