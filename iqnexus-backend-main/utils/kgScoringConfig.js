/**
 * Kindergarten paper scoring config.
 *
 * Defaults remain for backward compatibility when an answer key has no
 * scoringPattern. New flow: admin defines 1…N sections (from/to + marks)
 * on the answer key; auto-score uses that pattern.
 */

import { normalizeKgClass } from "./kgHelpers.js";

/** Soft cap for template / answer-key question indices (not a section count limit) */
export const KG_MAX_TEMPLATE_QUESTIONS = 100;

/** Default paper structure by class (NURSERY ← PG) — used only as fallback */
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

/**
 * Build a default scoringPattern from legacy class paper config.
 * Achiever is marked isAchiever:true (index 2 sequentially; dual-write still
 * maps to section5 for old ranking when only 2 sections).
 */
export function defaultScoringPattern(classValue) {
  const paper = getKgPaperConfig(classValue);
  const gEnd = paper.general.count;
  return {
    totalQuestions: paper.totalQuestions,
    sections: [
      {
        index: 1,
        from: 1,
        to: gEnd,
        marksPerQuestion: paper.general.marksPerQuestion,
        label: "General",
        isAchiever: false,
      },
      {
        index: 2,
        from: gEnd + 1,
        to: paper.totalQuestions,
        marksPerQuestion: paper.achiever.marksPerQuestion,
        label: "Achiever",
        isAchiever: true,
      },
    ],
  };
}

/**
 * Normalize + validate a user-supplied scoringPattern.
 * Returns { ok: true, pattern } or { ok: false, error }.
 */
export function normalizeScoringPattern(raw, { require = false } = {}) {
  if (raw == null || raw === "") {
    if (require) return { ok: false, error: "scoringPattern is required" };
    return { ok: true, pattern: null };
  }

  let totalQuestions = Number(raw.totalQuestions);
  const sectionsIn = Array.isArray(raw.sections) ? raw.sections : null;
  if (!sectionsIn || sectionsIn.length === 0) {
    return { ok: false, error: "scoringPattern.sections must be a non-empty array" };
  }
  if (!Number.isFinite(totalQuestions) || totalQuestions < 1) {
    // Infer from max `to`
    totalQuestions = Math.max(
      ...sectionsIn.map((s) => Number(s.to) || 0),
      0
    );
  }
  if (!Number.isFinite(totalQuestions) || totalQuestions < 1) {
    return { ok: false, error: "scoringPattern.totalQuestions must be >= 1" };
  }
  if (totalQuestions > KG_MAX_TEMPLATE_QUESTIONS) {
    return {
      ok: false,
      error: `totalQuestions cannot exceed ${KG_MAX_TEMPLATE_QUESTIONS}`,
    };
  }

  const sections = [];
  const covered = new Set();

  for (let i = 0; i < sectionsIn.length; i++) {
    const s = sectionsIn[i] || {};
    const index = Number(s.index != null ? s.index : i + 1);
    const from = Number(s.from);
    const to = Number(s.to);
    const marksPerQuestion = Number(s.marksPerQuestion);
    const label = String(s.label || `Section ${index}`).trim();
    const isAchiever = Boolean(s.isAchiever);

    if (!Number.isFinite(index) || index < 1) {
      return { ok: false, error: `sections[${i}].index must be >= 1` };
    }
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
      return {
        ok: false,
        error: `sections[${i}] needs valid from/to (from <= to, from >= 1)`,
      };
    }
    if (to > totalQuestions) {
      return {
        ok: false,
        error: `sections[${i}].to (${to}) exceeds totalQuestions (${totalQuestions})`,
      };
    }
    if (!Number.isFinite(marksPerQuestion) || marksPerQuestion <= 0) {
      return {
        ok: false,
        error: `sections[${i}].marksPerQuestion must be > 0`,
      };
    }

    for (let q = from; q <= to; q++) {
      if (covered.has(q)) {
        return {
          ok: false,
          error: `Question ${q} appears in more than one section`,
        };
      }
      covered.add(q);
    }

    sections.push({
      index,
      from,
      to,
      marksPerQuestion,
      label,
      isAchiever,
    });
  }

  // Every question 1..totalQuestions must belong to exactly one section
  for (let q = 1; q <= totalQuestions; q++) {
    if (!covered.has(q)) {
      return {
        ok: false,
        error: `Question ${q} is not covered by any section`,
      };
    }
  }

  // At most one achiever section (optional)
  const achievers = sections.filter((s) => s.isAchiever);
  if (achievers.length > 1) {
    return { ok: false, error: "Only one section may be marked isAchiever" };
  }

  sections.sort((a, b) => a.from - b.from || a.index - b.index);

  return {
    ok: true,
    pattern: { totalQuestions, sections },
  };
}

export function patternMaxScore(pattern) {
  if (!pattern?.sections?.length) return 0;
  return pattern.sections.reduce(
    (sum, s) => sum + (s.to - s.from + 1) * s.marksPerQuestion,
    0
  );
}

export function resolveScoringPattern(patternOrNull, classValue) {
  if (patternOrNull?.sections?.length) {
    const validated = normalizeScoringPattern(patternOrNull);
    if (validated.ok) return validated.pattern;
  }
  return defaultScoringPattern(classValue);
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
