import {
  fetchImage,
  generateAndUploadDocument,
  generateBulkPdfBuffer,
  normalizeCertType,
  CERT_TYPES,
} from "../services/certificateService.js";
import { fetchDataByMobile } from "../services/studentService.js";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";
import {
  resolveCalendarYear,
  applyCalendarYearFilter,
} from "../utils/resolveCalendarYear.js";
import { isKgClass, kgStudentsClassQuery } from "../utils/kgHelpers.js";

const studentCache = {};

const toCertInfo = (student, schoolName) => {
  const name = student.studentName || student["Student's Name"] || "";
  const mob = student.mobNo || student["Mob No"] || "";
  return {
    "Student's Name": name,
    studentName: name,
    "Mob No": mob,
    mobNo: mob,
    rollNo: student.rollNo || student["Roll No"] || "",
    schoolCode: student.schoolCode,
    School: schoolName || student.schoolName || "",
    schoolName: schoolName || student.schoolName || "",
    class: student.class,
    section: student.section,
  };
};

/**
 * GET /fetch-certificate/:mobNo?type=participation|l1|l2|prize
 */
export const fetchCertificate = async (req, res) => {
  const { mobNo } = req.params;
  const type = normalizeCertType(req.query.type || "participation");

  try {
    let studentData = studentCache[mobNo] || (await fetchDataByMobile(mobNo));
    const student = Array.isArray(studentData) ? studentData[0] : studentData;

    if (!student || !(student["Mob No"] || student.mobNo)) {
      return res
        .status(404)
        .json({ error: "No student found with this mobile number" });
    }
    studentCache[mobNo] = student;

    const studentName = student["Student's Name"] || student.studentName;
    if (!studentName) {
      return res.status(400).json({ error: "Invalid student details" });
    }

    fetchImage(type, studentName, res, {
      mobNo: student["Mob No"] || student.mobNo || mobNo,
      rollNo: student.rollNo || student["Roll No"],
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching certificate", details: error.message });
  }
};

/**
 * POST /generate/:type
 * body: { mobNo, force? }
 * type: participation | l1 | l2 | prize | certificate (alias)
 */
export const generateDocument = async (req, res) => {
  const type = normalizeCertType(req.params.type);
  const { mobNo, force = false } = req.body;

  try {
    if (!CERT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Use: ${CERT_TYPES.join(", ")}`,
      });
    }
    if (!mobNo) {
      return res.status(400).json({ error: "mobNo is required" });
    }

    const rawData = studentCache[mobNo] || (await fetchDataByMobile(mobNo));
    const studentData = Array.isArray(rawData) ? rawData[0] : rawData;
    if (!studentData || !(studentData["Mob No"] || studentData.mobNo)) {
      return res
        .status(404)
        .json({ error: "No student found with this mobile number" });
    }

    studentCache[mobNo] = studentData;

    const info = toCertInfo(studentData, studentData.School || studentData.schoolName);
    const fileName = await generateAndUploadDocument(info, type, {
      force: Boolean(force),
    });
    res.json({
      message: `${type} certificate generated successfully`,
      fileName,
      type,
    });
  } catch (error) {
    res.status(500).json({
      error: `Error generating ${type} certificate`,
      details: error.message,
    });
  }
};

/**
 * POST /generate-certificates-bulk
 * body: { schoolCode, type, calendarYear?, classes?, examLevel? }
 * Streams a multi-page PDF (one page per student).
 */
export const generateCertificatesBulk = async (req, res) => {
  try {
    const {
      schoolCode,
      type = "participation",
      calendarYear,
      classes,
      examLevel,
    } = req.body;

    const certType = normalizeCertType(type);
    if (!CERT_TYPES.includes(certType)) {
      return res.status(400).json({
        error: `Invalid type. Use: ${CERT_TYPES.join(", ")}`,
      });
    }
    if (!schoolCode) {
      return res.status(400).json({ error: "schoolCode is required" });
    }

    const yearLabel = await resolveCalendarYear(calendarYear);
    const school = await School.findOne({
      schoolCode: Number(schoolCode),
    }).lean();
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    const query = { schoolCode: Number(schoolCode) };
    applyCalendarYearFilter(query, yearLabel);

    const classList = Array.isArray(classes)
      ? classes.map(String)
      : classes
        ? [String(classes)]
        : [];

    const hasKg =
      classList.some((c) => isKgClass(c)) ||
      classList.includes("KD") ||
      classList.length === 0;

    const students = [];

    // Regular
    const regularQuery = { ...query };
    if (classList.length > 0) {
      const regularClasses = classList.filter((c) => !isKgClass(c) && c !== "KD");
      if (regularClasses.length > 0) {
        regularQuery.class = { $in: regularClasses };
        if (examLevel === "L1") {
          regularQuery.$or = [
            { IAOL1: "1" },
            { ITSTL1: "1" },
            { IMOL1: "1" },
            { IGKOL1: "1" },
            { IENGOL1: "1" },
          ];
        } else if (examLevel === "L2") {
          regularQuery.$or = [
            { IAOL2: "1" },
            { ITSTL2: "1" },
            { IMOL2: "1" },
            { IENGOL2: "1" },
          ];
        }
        const regs = await STUDENT_LATEST.find(regularQuery)
          .select("studentName mobNo rollNo schoolCode class section")
          .lean();
        students.push(...regs);
      }
    } else {
      if (examLevel === "L1") {
        regularQuery.$or = [
          { IAOL1: "1" },
          { ITSTL1: "1" },
          { IMOL1: "1" },
          { IGKOL1: "1" },
          { IENGOL1: "1" },
        ];
      } else if (examLevel === "L2") {
        regularQuery.$or = [
          { IAOL2: "1" },
          { ITSTL2: "1" },
          { IMOL2: "1" },
          { IENGOL2: "1" },
        ];
      }
      const regs = await STUDENT_LATEST.find(regularQuery)
        .select("studentName mobNo rollNo schoolCode class section")
        .limit(2000)
        .lean();
      students.push(...regs);
    }

    // KG
    if (hasKg) {
      const kgQuery = { ...query, ...kgStudentsClassQuery() };
      if (classList.length > 0) {
        const kgClasses = classList.filter((c) => isKgClass(c));
        if (kgClasses.length > 0) kgQuery.class = { $in: kgClasses };
      }
      if (examLevel === "L1" || certType === "l1") kgQuery.IQKD1 = "1";
      if (examLevel === "L2" || certType === "l2") kgQuery.IQKD2 = "1";
      const kgs = await KINDERGARTEN_STUDENT.find(kgQuery)
        .select("studentName mobNo rollNo schoolCode class section")
        .limit(2000)
        .lean();
      students.push(...kgs);
    }

    if (students.length === 0) {
      return res.status(404).json({
        error: "No students found for the selected filters",
      });
    }

    // Also persist individuals to GridFS (best-effort, non-blocking failures)
    const infos = students.map((s) => toCertInfo(s, school.schoolName));
    for (const info of infos) {
      try {
        await generateAndUploadDocument(info, certType, { force: false });
      } catch (e) {
        console.warn("Cert upload skip:", info.rollNo, e.message);
      }
    }

    const buffer = await generateBulkPdfBuffer(infos, certType);
    const filename = `${certType}_certificates_school_${schoolCode}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("X-Certificate-Count", String(infos.length));
    return res.send(buffer);
  } catch (error) {
    console.error("Bulk certificate error:", error);
    res.status(500).json({
      error: "Failed to generate bulk certificates",
      details: error.message,
    });
  }
};
