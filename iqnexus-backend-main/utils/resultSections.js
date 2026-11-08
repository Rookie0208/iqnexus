/**
 * Helpers to read section scores from either:
 * - new shape: result.sections[] (1…N)
 * - legacy shape: result.section1 … result.section5
 */

export function getResultSections(resultData) {
  if (!resultData) return [];
  if (Array.isArray(resultData.sections) && resultData.sections.length > 0) {
    return resultData.sections
      .map((s, i) => ({
        index: Number(s.index != null ? s.index : i + 1),
        label: s.label || `Section ${s.index != null ? s.index : i + 1}`,
        score: Number(s.score) || 0,
        percentage: Number(s.percentage) || 0,
        correctCount: Number(s.correctCount) || 0,
        totalCount: Number(s.totalCount) || 0,
        unAttempted: Number(s.unAttempted) || 0,
        maxScore: Number(s.maxScore) || 0,
        isAchiever: Boolean(s.isAchiever),
      }))
      .sort((a, b) => a.index - b.index);
  }

  const legacy = [];
  for (let i = 1; i <= 5; i++) {
    const s = resultData[`section${i}`];
    if (!s) continue;
    // Skip empty legacy slots (all zeros / missing score fields entirely unused)
    const hasData =
      s.score != null ||
      s.totalCount != null ||
      s.correctCount != null ||
      s.percentage != null;
    if (!hasData) continue;
    legacy.push({
      index: i,
      label: `Section ${i}`,
      score: Number(s.score) || 0,
      percentage: Number(s.percentage) || 0,
      correctCount: Number(s.correctCount) || 0,
      totalCount: Number(s.totalCount) || 0,
      unAttempted: Number(s.unAttempted) || 0,
      maxScore: 0,
      isAchiever: false,
    });
  }
  return legacy;
}

export function getSectionByIndex(resultData, index) {
  const sections = getResultSections(resultData);
  return sections.find((s) => s.index === Number(index)) || null;
}

/**
 * Achiever score: prefer section flagged isAchiever, else achieversSectionIndex
 * from subject config / pattern, else last section.
 */
export function getAchieverSection(resultData, achieversSectionIndex) {
  const sections = getResultSections(resultData);
  if (!sections.length) return null;

  const flagged = sections.find((s) => s.isAchiever);
  if (flagged) return flagged;

  if (achieversSectionIndex != null) {
    const byIdx = sections.find((s) => s.index === Number(achieversSectionIndex));
    if (byIdx) return byIdx;
  }

  // Legacy: often section5
  const s5 = sections.find((s) => s.index === 5);
  if (s5) return s5;

  return sections[sections.length - 1];
}

export function sumOtherSectionScores(resultData, achieverIndex) {
  const sections = getResultSections(resultData);
  return sections.reduce((sum, s) => {
    if (Number(s.index) === Number(achieverIndex)) return sum;
    return sum + (Number(s.score) || 0);
  }, 0);
}

/**
 * Dual-write helper: map sections[] onto section1…section5 for consumers
 * that still read fixed keys. Extra sections beyond 5 are only in sections[].
 */
export function sectionsToLegacyFields(sections) {
  const out = {};
  for (let i = 1; i <= 5; i++) {
    out[`section${i}`] = {
      score: 0,
      percentage: 0,
      correctCount: 0,
      totalCount: 0,
      unAttempted: 0,
    };
  }
  for (const s of sections || []) {
    const idx = Number(s.index);
    if (idx >= 1 && idx <= 5) {
      out[`section${idx}`] = {
        score: Number(s.score) || 0,
        percentage: Number(s.percentage) || 0,
        correctCount: Number(s.correctCount) || 0,
        totalCount: Number(s.totalCount) || 0,
        unAttempted: Number(s.unAttempted) || 0,
      };
    }
  }
  // If sequential indices 1..N with N<=5 and an achiever not at 5,
  // also mirror achiever into section5 when only 2 sections (legacy KG layout)
  const list = sections || [];
  if (list.length === 2) {
    const achiever = list.find((s) => s.isAchiever) || list[1];
    if (achiever && Number(achiever.index) !== 5) {
      out.section5 = {
        score: Number(achiever.score) || 0,
        percentage: Number(achiever.percentage) || 0,
        correctCount: Number(achiever.correctCount) || 0,
        totalCount: Number(achiever.totalCount) || 0,
        unAttempted: Number(achiever.unAttempted) || 0,
      };
    }
  }
  return out;
}
