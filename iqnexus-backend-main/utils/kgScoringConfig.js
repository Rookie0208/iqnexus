/**
 * Kindergarten paper scoring config.
 *
 * Template always has p1…p30; only the first N questions for the class are scored.
 * General = 1 mark each; Achiever (tail) = 2 marks each → section1 / section5
 * (section5 = achieversSectionIndex default used by ranking tie-break).
 */

import { normalizeKgClass } from "./kgHelpers.js";

export const KG_MAX_TEMPLATE_QUESTIONS = 30;

/** Default paper structure by class (NURSERY ← PG) */
export const KG_PAPER_BY_CLASS = {
  NURSERY: {
    totalQuestions: 20,
    general: { count: 15, marksPerQuestion: 1 },
    achiever: { count: 5, marksPerQuestion: 2 },
  },
  LKG: {
    totalQuestions: 25,
    general: { count: 20, marksPerQuestion: 1 },
    achiever: { count: 5, marksPerQuestion: 2 },
  },
  UKG: {
    totalQuestions: 30,
    general: { count: 25, marksPerQuestion: 1 },
    achiever: { count: 5, marksPerQuestion: 2 },
  },
};

export function getKgPaperConfig(classValue) {
  const cls = normalizeKgClass(classValue) || "UKG";
  return KG_PAPER_BY_CLASS[cls] || KG_PAPER_BY_CLASS.UKG;
}

export function getKgQuestionCount(classValue) {
  return getKgPaperConfig(classValue).totalQuestions;
}

export function kgMaxScore(classValue) {
  const paper = getKgPaperConfig(classValue);
  return (
    paper.general.count * paper.general.marksPerQuestion +
    paper.achiever.count * paper.achiever.marksPerQuestion
  );
}

/** Normalize answer-key / exam subject codes to IQKD1 | IQKD2 */
export function normalizeKgExamSubject(subject) {
  if (!subject) return null;
  const s = String(subject).trim().toUpperCase();
  const map = {
    IQKD1: "IQKD1",
    IQKD2: "IQKD2",
    IQKG1: "IQKD1",
    IQKG2: "IQKD2",
    IQKGL1: "IQKD1",
    IQKGL2: "IQKD2",
    IQKDL1: "IQKD1",
    IQKDL2: "IQKD2",
    IQKG: "IQKD1",
    IQKD: "IQKD1",
  };
  return map[s] || null;
}

export function isKgExamSubject(subject) {
  return Boolean(normalizeKgExamSubject(subject));
}
