import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";

/** Internal result/enrollment field → display exam code */
const FIELD_TO_EXAM = {
  IENGOL1: "IQEOL1",
  IENGOL2: "IQEOL2",
  IAOL1: "IQROL1",
  IAOL2: "IQROL2",
  ITSTL1: "IQSOL1",
  ITSTL2: "IQSOL2",
  IMOL1: "IQMOL1",
  IMOL2: "IQMOL2",
  IGKOL1: "IQGKOL1",
  IGKOL2: "IQGKOL2",
};

const L1_FIELDS = ["IAOL1", "ITSTL1", "IMOL1", "IGKOL1", "IENGOL1"];
const L2_FIELDS = ["IAOL2", "ITSTL2", "IMOL2", "IENGOL2"];

/**
 * GET /fetchBLQList
 * Basic/Advance Level QUALIFICATION list — students who PASSED (passOrFail=PASS),
 * not merely enrolled (enrollment "1" = participation).
 *
 * Query: examLevel (L1|L2), schoolCode, subject (JSON array of {value,label}),
 *        studentClass / classes (optional), sections (optional)
 */
export const fetchBLQList = async (req, res) => {
  const { schoolCode, examLevel } = req.query;

  if (!examLevel) {
    return res.status(400).json({ message: "examLevel is required (L1 or L2)" });
  }
  if (!schoolCode) {
    return res.status(400).json({ message: "schoolCode is required" });
  }

  let subjectArray = [];
  try {
    if (req.query.subject) {
      const parsed = JSON.parse(req.query.subject);
      subjectArray = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    return res.status(400).json({ message: "subject must be a JSON array" });
  }

  try {
    const levelFields = examLevel === "L2" ? L2_FIELDS : L1_FIELDS;

    // Selected subject fields (internal names like IENGOL1); empty = all for level
    let selectedFields = levelFields;
    if (subjectArray.length > 0) {
      selectedFields = subjectArray
        .map((sub) => sub?.value)
        .filter((v) => levelFields.includes(v));
      if (selectedFields.length === 0) {
        return res.status(400).json({
          message: "No valid subjects for the selected exam level",
        });
      }
    }

    const query = {
      schoolCode: Number(schoolCode),
    };

    // Class filter (single or multi)
    let classes = [];
    if (req.query.classes) {
      try {
        const parsed = JSON.parse(req.query.classes);
        classes = Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        classes = String(req.query.classes)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
      }
    } else if (req.query.studentClass) {
      classes = [String(req.query.studentClass)];
    }
    if (classes.length === 1) query.class = classes[0];
    else if (classes.length > 1) query.class = { $in: classes };

    // Section filter
    if (req.query.sections) {
      try {
        const parsed = JSON.parse(req.query.sections);
        if (Array.isArray(parsed) && parsed.length > 0) {
          query.section = { $in: parsed.map(String) };
        }
      } catch {
        /* ignore bad sections */
      }
    }

    // Must be enrolled in at least one of the selected subjects (OR)
    query.$or = selectedFields.map((field) => ({ [field]: "1" }));

    const students = await STUDENT_LATEST.find(query).lean();
    if (!students || students.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }

    const studentData = [];

    for (const s of students) {
      const result = s.result || {};
      const base = {
        studentName: s.studentName,
        rollNo: s.rollNo,
        class: s.class,
        schoolCode: s.schoolCode,
        fatherName: s.fatherName,
        motherName: s.motherName,
        section: s.section,
      };

      for (const field of selectedFields) {
        const subjectResult = result[field];
        if (!subjectResult || subjectResult.total?.score == null) continue;

        const passOrFail = String(subjectResult.passOrFail || "").toUpperCase();
        const attendance = String(subjectResult.attendance || "").toUpperCase();

        // Qualification = PRESENT + PASS (not mere participation / enrollment)
        if (attendance === "ABSENT" || attendance === "DISQUALIFIED") continue;
        if (passOrFail !== "PASS") continue;

        studentData.push({
          ...base,
          subjectField: field,
          subject: FIELD_TO_EXAM[field] || field,
          enrollment: s[field],
          passOrFail,
          percentage: subjectResult.total?.percentage ?? null,
          score: subjectResult.total?.score ?? null,
          qualified: true,
          // Keep legacy field for older UI snippets
          [field]: s[field],
        });
      }
    }

    if (studentData.length === 0) {
      return res.status(404).json({
        error: "No qualified students found for the selected filters",
      });
    }

    // Stable order: class → section → roll → subject
    studentData.sort((a, b) => {
      const c = String(a.class).localeCompare(String(b.class), undefined, {
        numeric: true,
      });
      if (c) return c;
      const sec = String(a.section || "").localeCompare(String(b.section || ""));
      if (sec) return sec;
      const r = String(a.rollNo).localeCompare(String(b.rollNo), undefined, {
        numeric: true,
      });
      if (r) return r;
      return String(a.subject).localeCompare(String(b.subject));
    });

    const schoolName = await School.findOne({
      schoolCode: Number(schoolCode),
    }).lean();

    res.status(200).json({
      studentData,
      school: schoolName,
      meta: {
        type: "qualification",
        examLevel,
        subjectFields: selectedFields,
        count: studentData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching qualification list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
