import { PrizeConfig } from "../models/prizeConfigModel.js";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";
import { isKgClass, kgStudentsClassQuery } from "../utils/kgHelpers.js";

/* ── Exam code → result-field mapping ── */
const examFieldMap = {
  IQEOL1: "IENGOL1",
  IQEOL2: "IENGOL2",
  IQROL1: "IAOL1",
  IQROL2: "IAOL2",
  IQSOL1: "ITSTL1",
  IQSOL2: "ITSTL2",
  IQMOL1: "IMOL1",
  IQMOL2: "IMOL2",
  IQGKOL1: "IGKOL1",
  IQGKOL2: "IGKOL2",
  IQKD1: "IQKD1",
  IQKD2: "IQKD2",
  IQKG1: "IQKD1",
  IQKG2: "IQKD2",
  IQKGL1: "IQKD1",
  IQKGL2: "IQKD2",
};

const isKGExam = (subject) =>
  ["IQKD1", "IQKD2", "IQKG1", "IQKG2", "IQKGL1", "IQKGL2"].includes(subject);
const getStudentModel = (subject) =>
  isKGExam(subject) ? KINDERGARTEN_STUDENT : STUDENT_LATEST;

/** Categories that must be ranked on the full dataset (not school-first) */
const GLOBAL_SCOPE_CATEGORIES = new Set(["NATIONALITY", "COUNTRY", "CITY"]);

/**
 * Helper: pick students from positions (offset+1) to (offset+N)
 * in a sorted-descending list, honouring ties at the boundary.
 */
const pickRange = (sorted, offset, n) => {
  if (n <= 0 || sorted.length === 0) return { winners: [], tiedCount: 0 };

  const remaining = sorted.slice(offset);
  if (remaining.length === 0) return { winners: [], tiedCount: 0 };

  if (remaining.length <= n) return { winners: [...remaining], tiedCount: 0 };

  const cutoffScore = remaining[n - 1].score;
  const winners = [];
  let tiedCount = 0;

  for (const s of remaining) {
    if (s.score > cutoffScore) {
      winners.push(s);
    } else if (s.score === cutoffScore) {
      winners.push(s);
    } else {
      break;
    }
  }

  if (winners.length > n) {
    tiedCount = winners.filter((w) => w.score === cutoffScore).length;
  }

  return { winners, tiedCount };
};

/* ══════════════════════════════════════════════════════
   GET /prize-tag
   Query: exam, level, schoolCode, classLevel (optional), batchId (optional)
   Returns: school info + prize rows with student lists

   National / Country / City winners are computed from the FULL student
   pool first, then filtered to the requested school for display.
   School / Class / Section prizes stay within the selected school.
   ══════════════════════════════════════════════════════ */
export const getPrizeTag = async (req, res) => {
  try {
    const {
      exam,
      level = "basic",
      schoolCode,
      classLevel = "all",
      batchId = "2024-25",
    } = req.query;

    if (!exam || !schoolCode) {
      return res
        .status(400)
        .json({ success: false, error: "exam and schoolCode are required" });
    }

    const selectedSchoolCode = Number(schoolCode);
    const resultKey = examFieldMap[exam] || exam;
    const StudentModel = getStudentModel(exam);

    /* ── 1. School info ── */
    const school = await School.findOne({
      schoolCode: selectedSchoolCode,
    }).lean();
    if (!school) {
      return res
        .status(404)
        .json({ success: false, error: "School not found" });
    }

    /* ── 2. Prize config ── */
    let config = await PrizeConfig.findOne({
      exam,
      classLevel,
      batchId,
      level,
    }).lean();
    if (!config && classLevel !== "all") {
      config = await PrizeConfig.findOne({
        exam,
        classLevel: "all",
        batchId,
        level,
      }).lean();
    }
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Prize configuration not found for this exam/level",
      });
    }

    /* ── 3. ALL PRESENT students for this exam (full dataset) ── */
    const studentQuery = {
      [`result.${resultKey}.attendance`]: "PRESENT",
      [`result.${resultKey}.total.score`]: { $exists: true },
    };
    if (classLevel !== "all") {
      if (isKgClass(classLevel) || classLevel === "KG" || classLevel === "KD") {
        Object.assign(
          studentQuery,
          classLevel === "KG" || classLevel === "KD"
            ? kgStudentsClassQuery()
            : { class: classLevel }
        );
      } else {
        studentQuery.class = classLevel;
      }
    }

    const students = await StudentModel.find(studentQuery)
      .select(
        `rollNo studentName fatherName class section schoolCode city result.${resultKey}.total.score`
      )
      .lean();

    /* schoolCode → city from School collection (fallback when student.city empty) */
    const schoolCodes = [
      ...new Set(
        students
          .map((s) => Number(s.schoolCode))
          .filter((c) => Number.isFinite(c) && c > 0)
      ),
    ];
    const schoolDocs = await School.find({
      schoolCode: { $in: schoolCodes },
    })
      .select("schoolCode city schoolName")
      .lean();
    const cityBySchool = {};
    for (const s of schoolDocs) {
      cityBySchool[Number(s.schoolCode)] = String(s.city || "")
        .trim()
        .toUpperCase();
    }

    const studentData = students
      .map((s) => {
        const sc = Number(s.schoolCode) || 0;
        const city =
          String(s.city || "").trim().toUpperCase() ||
          cityBySchool[sc] ||
          "";
        return {
          rollNo: s.rollNo,
          studentName: s.studentName || "",
          fatherName: s.fatherName || "",
          class: s.class || "",
          section: s.section || "",
          schoolCode: sc,
          city,
          score: s.result?.[resultKey]?.total?.score ?? 0,
        };
      })
      .sort((a, b) => b.score - a.score);

    const schoolStudents = studentData.filter(
      (s) => s.schoolCode === selectedSchoolCode
    );

    /* ── 4. Walk prize rules in priority order ── */
    const prizeRules = [...config.prizeRules].sort(
      (a, b) => a.priority - b.priority
    );
    const assignedStudents = new Set();
    const prizes = [];
    const groupedOffset = {};

    for (const rule of prizeRules) {
      let winners = [];
      let tiedCount = 0;
      const configuredMax = rule.totalPrizes;

      if (rule.totalPrizes === 0 && rule.category !== "all") {
        prizes.push({
          srNo: rule.priority,
          prizeType: rule.prizeType,
          category: rule.category,
          show: rule.show,
          total: 0,
          configuredMax: 0,
          tiedCount: 0,
          students: [],
        });
        continue;
      }

      const pool = GLOBAL_SCOPE_CATEGORIES.has(rule.category)
        ? studentData
        : schoolStudents;

      const eligible = pool.filter(
        (s) =>
          !(rule.excludeHigherPrizeWinners && assignedStudents.has(s.rollNo))
      );

      const groups = {};

      if (rule.category === "CLASS") {
        for (const s of eligible) {
          if (!groups[s.class]) groups[s.class] = [];
          groups[s.class].push(s);
        }
      } else if (rule.category === "SECTION") {
        for (const s of eligible) {
          const key = `${s.class}__${s.section}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(s);
        }
      } else if (rule.category === "CITY") {
        // One group per city across ALL schools
        for (const s of eligible) {
          const key = s.city || "_UNKNOWN_CITY";
          if (!groups[key]) groups[key] = [];
          groups[key].push(s);
        }
      } else if (rule.category === "SCHOOL") {
        // Group by school; we only need the selected school's group for display,
        // but still use school-scoped eligible pool above.
        groups[String(selectedSchoolCode)] = eligible;
      } else {
        // NATIONALITY, COUNTRY, all → single pool
        groups["_all"] = eligible;
      }

      if (rule.category === "all") {
        winners = [...eligible];
      } else {
        for (const groupKey of Object.keys(groups)) {
          const fullKey = `${rule.category}__${groupKey}`;
          const offset = groupedOffset[fullKey] || 0;
          // Keep each city/class group sorted by score
          const sortedGroup = [...groups[groupKey]].sort(
            (a, b) => b.score - a.score
          );
          const result = pickRange(sortedGroup, offset, rule.totalPrizes);
          winners.push(...result.winners);
          tiedCount += result.tiedCount;
          groupedOffset[fullKey] =
            offset + Math.max(rule.totalPrizes, result.winners.length);
        }
      }

      // Always mark ALL computed winners as assigned (full national/city set),
      // so exclude-higher works correctly across scopes.
      for (const w of winners) {
        assignedStudents.add(w.rollNo);
      }

      // For school prize-tag PDF: only list winners who belong to this school.
      // National/city winners from other schools are calculated but not shown here.
      const displayWinners = GLOBAL_SCOPE_CATEGORIES.has(rule.category)
        ? winners.filter((w) => w.schoolCode === selectedSchoolCode)
        : winners;

      prizes.push({
        srNo: rule.priority,
        prizeType: rule.prizeType,
        category: rule.category,
        show: rule.show,
        total: displayWinners.length,
        configuredMax,
        tiedCount,
        globalWinnerCount: GLOBAL_SCOPE_CATEGORIES.has(rule.category)
          ? winners.length
          : undefined,
        students: displayWinners.map((w) => ({
          rollNo: w.rollNo,
          studentName: w.studentName,
          fatherName: w.fatherName,
          class: w.class,
          section: w.section,
          schoolCode: w.schoolCode,
          city: w.city,
          score: w.score,
        })),
      });
    }

    return res.status(200).json({
      success: true,
      school: {
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        city: school.city || "",
        state: school.country || "",
      },
      exam,
      level,
      scopeNote:
        "National/Country/City prizes are ranked on the full dataset; this response lists only winners from the selected school.",
      prizes,
    });
  } catch (error) {
    console.error("Error fetching prize tag:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch prize tag data" });
  }
};
