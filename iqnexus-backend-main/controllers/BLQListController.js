import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";

const examNameMapping = {
  IQMO: "IMO",
  IQSO: "ITST",
  IQEO: "IENGO",
  IQRO: "IAO",
  IQGKO: "IGKO",
};

export const fetchBLQList = async (req, res) => {
  const { studentClass, schoolCode, examLevel, subject } = req.query;
  
  if (!req.query.subject) {
    return res.status(400).json({ message: "Subject parameter is required" });
  }
  
  try {
    const subjectArray = JSON.parse(req.query.subject);
    console.log(subjectArray);
    const query = {};
    if (studentClass) {
      query.class = studentClass;
    }
    if (schoolCode) {
      query.schoolCode = Number(schoolCode);
    }
  if (subject) {
    subjectArray.forEach((sub) => {
      const examName =sub.value
      if (examName) {
        query[examName] = "1"; // Assuming "1" indicates participation
      }
    });
      }
  if (examLevel && subjectArray.length ==0) {
    console.log("Exam Level:", examLevel);
    if (examLevel === "L1") {
      query.$or = [
        { IAOL1: "1" },
        { ITSTL1: "1" },
        { IMOL1: "1" },
        { IGKOL1: "1" },
        { IENGOL1: "1" },
      ];
    } else if (examLevel === "L2") {
      query.$or = [
        { IAOL2: "1" },
        { ITSTL2: "1" },
        { IMOL2: "1" },
        { IENGOL2: "1" },
      ];
    }
  }
  //for storing student data
  const studentData = [];

    console.log("Query:", query);
    const student = await STUDENT_LATEST.find(query);

    if (!student || student.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }

    student.forEach((s) => {
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

      if (examLevel === "L1") {
        if (result.IAOL1?.total?.score != null) {
          studentData.push({ ...base, IAOL1: s.IAOL1, passOrFail: result.IAOL1.passOrFail });
        }
        if (result.ITSTL1?.total?.score != null) {
          studentData.push({ ...base, ITSTL1: s.ITSTL1, passOrFail: result.ITSTL1.passOrFail });
        }
        if (result.IMOL1?.total?.score != null) {
          studentData.push({ ...base, IMOL1: s.IMOL1, passOrFail: result.IMOL1.passOrFail });
        }
        if (result.IGKOL1?.total?.score != null) {
          studentData.push({ ...base, IGKOL1: s.IGKOL1, passOrFail: result.IGKOL1.passOrFail });
        }
        if (result.IENGOL1?.total?.score != null) {
          studentData.push({ ...base, IENGOL1: s.IENGOL1, passOrFail: result.IENGOL1.passOrFail });
        }
      }
      if (examLevel === "L2") {
        if (result.IAOL2?.total?.score != null) {
          studentData.push({ ...base, IAOL2: s.IAOL2, passOrFail: result.IAOL2.passOrFail });
        }
        if (result.ITSTL2?.total?.score != null) {
          studentData.push({ ...base, ITSTL2: s.ITSTL2, passOrFail: result.ITSTL2.passOrFail });
        }
        if (result.IMOL2?.total?.score != null) {
          studentData.push({ ...base, IMOL2: s.IMOL2, passOrFail: result.IMOL2.passOrFail });
        }
        if (result.IENGOL2?.total?.score != null) {
          studentData.push({ ...base, IENGOL2: s.IENGOL2, passOrFail: result.IENGOL2.passOrFail });
        }
      }
    });

    const schoolName = await School.findOne({ schoolCode: schoolCode });
    res.status(200).json({ studentData: studentData, school: schoolName });
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
