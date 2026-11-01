import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import {
  KG_CLASSES,
  isKgClass,
  normalizeKgClass,
  kgStudentsClassQuery,
} from "../utils/kgHelpers.js";
import {
  resolveCalendarYear,
  applyCalendarYearFilter,
} from "../utils/resolveCalendarYear.js";

const studentCache = {};
const examNameMapping = {
  IQMO: 'IMO',
  IQSO: 'ITST',
  IQEO: 'IENGO',
  IQRO: 'IAO',
  IQGKO: 'IGKO'
};

const kgExamMapping = {
  IQKD: 'IQKD'
};

const KG_EXAM_CODES = ["IQKD1", "IQKD2", "IQKG1", "IQKG2", "IQKGL1", "IQKGL2"];

export const getParticipationFilteredList = async (req, res) => {
  const { schoolCode, classes, sections, exam, examLevel, calendarYear } = req.body;

  try {
    const yearLabel = await resolveCalendarYear(calendarYear);

    // Find school
    const school = await School.findOne({ schoolCode }) || {};
    
    const selectedKgClasses = (classes || [])
      .map(normalizeKgClass)
      .filter(Boolean);
    const hasKDClass =
      selectedKgClasses.length > 0 ||
      (classes && classes.some((c) => c === "KD" || isKgClass(c)));
    const hasKDExam = exam && exam.some(examObj => KG_EXAM_CODES.includes(examObj?.value));
    const hasOnlyKDExam = exam && exam.length > 0 && exam.every(examObj => KG_EXAM_CODES.includes(examObj?.value));
    const isL1LevelOnly = examLevel === "L1" && (!exam || exam.length === 0);
    const regularClasses = classes
      ? classes.filter((cls) => !isKgClass(cls) && cls !== "KD" && !KG_CLASSES.includes(cls))
      : [];
    
    let students = [];
    
    // Fetch kindergarten students if KG class/exam selected
    if (hasKDClass || hasKDExam || isL1LevelOnly) {
      const kgQuery = selectedKgClasses.length
        ? { class: { $in: selectedKgClasses } }
        : { ...kgStudentsClassQuery() };
      applyCalendarYearFilter(kgQuery, yearLabel);
      
      if (schoolCode) {
        kgQuery.schoolCode = { $in: schoolCode };
      }
      
      if (sections && sections.length > 0) {
        kgQuery.section = { $in: sections.map((s) => String(s).toUpperCase()) };
      }
      
      if (exam && exam.length > 0) {
        for (const examObj of exam) {
          const examValue = examObj?.value;
          if (examValue === "IQKD1" || examValue === "IQKG1" || examValue === "IQKGL1") {
            kgQuery.IQKD1 = "1";
          } else if (examValue === "IQKD2" || examValue === "IQKG2" || examValue === "IQKGL2") {
            kgQuery.IQKD2 = "1";
          }
        }
      } else if (examLevel === "L1") {
        kgQuery["$or"] = [{ IQKD1: "1" }];
      } else if (examLevel === "L2") {
        kgQuery["$or"] = [{ IQKD2: "1" }];
      }
      
      console.log("KG Query:", kgQuery);
      const kgStudents = await KINDERGARTEN_STUDENT.find(kgQuery);
      students = students.concat(kgStudents);
    }
    
    // Fetch regular students if regular classes are selected OR if exam level is selected without classes
    // BUT skip if only kindergarten exams are selected
    if (!hasOnlyKDExam && (regularClasses.length > 0 || (!hasKDClass && (!classes || classes.length === 0)) || examLevel)) {
      const query = {};
      applyCalendarYearFilter(query, yearLabel);
      
      if (schoolCode) {
        query.schoolCode = { $in: schoolCode };
      }

      if (regularClasses.length > 0) {
        query.class = { $in: regularClasses };
      }

      if (sections && sections.length > 0) {
        query.section = { $in: sections };
      }

      // Handle regular student exams
      if (exam && exam.length > 0) {
        for (const examObj of exam) {
          const examValue = examObj?.value;
          
          // Skip kindergarten exams in regular student query
          if (examValue && examValue.startsWith('IQKD')) {
            continue;
          }

          const levelMatch = examValue?.match(/(L1|L2)$/);
          const examName = examValue?.replace(/(L1|L2)$/, '');

          if (!levelMatch || !examNameMapping[examName]) {
            return res.status(400).json({ message: `Invalid exam format or name: ${examValue}` });
          }

          const level = levelMatch[0]; // L1 or L2
          const oldExamName = examNameMapping[examName];
          const examField = `${oldExamName}${level}`;

          // Directly add each required exam to the query
          query[examField] = "1";
          console.log(query);
        }
      }
      
      console.log("Regular students query:", query);
      
      // Handle L1 exam level without specific exam
      if (examLevel === "L1" && (!exam || exam.length === 0)) {
        let basicExam = [
          { value: "IAOL1" },
          { value: "ITSTL1" },
          { value: "IENGOL1" },
          { value: "IMOL1" },
          { value: "IGKOL1" },
        ];

        const examConditions = [];
        for (const examObj of basicExam) {
          const examValue = examObj?.value;
          examConditions.push({ [examValue]: "1" });
        }
        
        if (examConditions.length > 0) {
          query["$or"] = examConditions;
        }
      }
      
      // Handle L2 exam level without specific exam
      if (examLevel === "L2" && (!exam || exam.length === 0)) {
        let advExam = [
          { value: "IAOL2" },
          { value: "ITSTL2" },
          { value: "IENGOL2" },
          { value: "IMOL2" },
        ];

        const examConditions = [];
        for (const examObj of advExam) {
          const examValue = examObj?.value;
          examConditions.push({ [examValue]: "1" });
        }
        
        if (examConditions.length > 0) {
          query["$or"] = examConditions;
        }
      }
      
      const regularStudents = await STUDENT_LATEST.find(query);
      students = students.concat(regularStudents);
    }
    
    console.log("Total students found:", students.length);
    return res.status(200).json({ student: students, school });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
