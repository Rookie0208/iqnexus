import { PrizeConfig } from "../models/prizeConfigModel.js";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";

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
};

const isKGExam = (subject) => ["IQKD1", "IQKD2"].includes(subject);
const getStudentModel = (subject) =>
  isKGExam(subject) ? KINDERGARTEN_STUDENT : STUDENT_LATEST;

/* ══════════════════════════════════════════════════════
   GET /prize-tag
   Query: exam, level, schoolCode, classLevel (optional), batchId (optional)
   Returns: school info + prize rows with student lists
   ══════════════════════════════════════════════════════ */
export const getPrizeTag = async (req, res) => {
  try {
    const { exam, level = "basic", schoolCode, classLevel = "all", batchId = "2024-25" } = req.query;

    if (!exam || !schoolCode) {
      return res
        .status(400)
        .json({ success: false, error: "exam and schoolCode are required" });
    }

    const resultKey = examFieldMap[exam] || exam;
    const StudentModel = getStudentModel(exam);

    /* ── 1. School info ── */
    const school = await School.findOne({
      schoolCode: Number(schoolCode),
    }).lean();
    if (!school) {
      return res
        .status(404)
        .json({ success: false, error: "School not found" });
    }

    /* ── 2. Prize config ── */
    // Try the requested classLevel first, then fall back to "all"
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

    /* ── 3. All PRESENT students from this school for this exam ── */
    const studentQuery = {
      schoolCode: Number(schoolCode),
      [`result.${resultKey}.attendance`]: "PRESENT",
      [`result.${resultKey}.total.score`]: { $exists: true },
    };
    // Filter by class if a specific class was selected
    if (classLevel !== "all") {
      studentQuery.class = classLevel;
    }

    const students = await StudentModel.find(studentQuery)
      .select(
        `rollNo studentName fatherName class section result.${resultKey}.total.score`
      )
      .lean();

    const studentData = students
      .map((s) => ({
        rollNo: s.rollNo,
        studentName: s.studentName || "",
        fatherName: s.fatherName || "",
        class: s.class || "",
        section: s.section || "",
        score: s.result?.[resultKey]?.total?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score); // descending by score

    /* ── 4. Walk through prize rules in priority order ── */
    const prizeRules = [...config.prizeRules].sort(
      (a, b) => a.priority - b.priority
    );
    const assignedStudents = new Set(); // roll numbers already awarded higher prizes
    const prizes = [];

    /**
     * Per-group running offset. Tracks how many positions we've already
     * handed out within each group so sequential prizes in the same scope
     * pick the NEXT students, not the same ones.
     * Key format: "CATEGORY__groupKey"  e.g. "NATIONALITY___all", "CLASS__5"
     */
    const groupedOffset = {};

    /**
     * Helper: pick students from positions (offset+1) to (offset+N)
     * in a sorted-descending list, honouring ties at the boundary.
     * Returns { winners, tiedCount }.
     */
    const pickRange = (sorted, offset, n) => {
      if (n <= 0 || sorted.length === 0) return { winners: [], tiedCount: 0 };

      // Skip the first `offset` positions (already awarded to higher prizes)
      const remaining = sorted.slice(offset);
      if (remaining.length === 0) return { winners: [], tiedCount: 0 };

      if (remaining.length <= n) return { winners: [...remaining], tiedCount: 0 };

      // The cutoff score is the score of the Nth student in remaining
      const cutoffScore = remaining[n - 1].score;
      const winners = [];
      let tiedCount = 0;

      for (const s of remaining) {
        if (s.score > cutoffScore) {
          winners.push(s);
        } else if (s.score === cutoffScore) {
          winners.push(s);
        } else {
          break; // sorted descending
        }
      }

      // Tied = those beyond the configured N
      if (winners.length > n) {
        tiedCount = winners.filter((w) => w.score === cutoffScore).length;
      }

      return { winners, tiedCount };
    };

    for (const rule of prizeRules) {
      let winners = [];
      let tiedCount = 0;
      const configuredMax = rule.totalPrizes;

      // totalPrizes === 0 means "don't award this prize" (except category "all")
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

      /*
       * 1. Build eligible student list (excluding higher-prize winners)
       */
      const eligible = studentData.filter(
        (s) =>
          !(rule.excludeHigherPrizeWinners && assignedStudents.has(s.rollNo))
      );

      /*
       * 2. Group students by scope.
       *    CLASS  → one group per class
       *    SECTION → one group per class+section
       *    Everything else (NATIONALITY, COUNTRY, CITY, SCHOOL, all) → single group
       */
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
      } else {
        // NATIONALITY, COUNTRY, CITY, SCHOOL, all → single pool
        groups["_all"] = eligible;
      }

      /*
       * 3. Pick winners from each group using positional offset
       */
      if (rule.category === "all") {
        // Certificate: everyone eligible gets it (no offset logic)
        winners = [...eligible];
      } else {
        for (const groupKey of Object.keys(groups)) {
          const fullKey = `${rule.category}__${groupKey}`;
          const offset = groupedOffset[fullKey] || 0;
          const result = pickRange(groups[groupKey], offset, rule.totalPrizes);
          winners.push(...result.winners);
          tiedCount += result.tiedCount;
          // Advance offset by the larger of configured or actual (to skip ties)
          groupedOffset[fullKey] =
            offset + Math.max(rule.totalPrizes, result.winners.length);
        }
      }

      // Track assigned students for the exclude-higher-winners logic
      for (const w of winners) {
        assignedStudents.add(w.rollNo);
      }

      prizes.push({
        srNo: rule.priority,
        prizeType: rule.prizeType,
        category: rule.category,
        show: rule.show,
        total: winners.length,
        configuredMax,
        tiedCount,
        students: winners.map((w) => ({
          rollNo: w.rollNo,
          studentName: w.studentName,
          fatherName: w.fatherName,
          class: w.class,
          section: w.section,
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
      prizes,
    });
  } catch (error) {
    console.error("Error fetching prize tag:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch prize tag data" });
  }
};
