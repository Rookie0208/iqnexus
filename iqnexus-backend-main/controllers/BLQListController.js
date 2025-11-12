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
  console.log(JSON.parse(req.query.subject))
  const subjectArray = JSON.parse(req.query.subject);
  const query = {};
  if (studentClass) {
    query.class = studentClass;
  }
  if (schoolCode) {
    query.schoolCode = schoolCode;
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
  try {
    console.log("Query:", query);
    const student = await STUDENT_LATEST.find(query);
    student.map((s) => {
      if (examLevel === "L1") {
        if (s.result.IAOL1.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IAOL1: s.IAOL1,
            passOrFail: s.result.IAOL1.passOrFail,
            fatherName: s.fatherName,
            motherName: s.motherName,
            section:s.section
          });
        }
        if (s.result.ITSTL1.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            ITSTL1: s.ITSTL1,
            passOrFail: s.result.ITSTL1.passOrFail,
          });
        }
        if (s.result.IMOL1.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IMOL1: s.IMOL1,
            passOrFail: s.result.IMOL1.passOrFail,
          });
        }
        if (s.result.IGKOL1.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IGKOL1: s.IGKOL1,
            passOrFail: s.result.IGKOL1.passOrFail,
          });
        }
        if (s.result.IENGOL1.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IENGOL1: s.IENGOL1,
            passOrFail: s.result.IENGOL1.passOrFail,
          });
        }
      }
      if (examLevel === "L2") {
        if (s.result.IAOL2.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IAOL2: s.IAOL2,
            passOrFail: s.result.IAOL2.passOrFail,
          });
        }
        if (s.result.ITSTL2.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            ITSTL2: s.ITSTL2,
            passOrFail: s.result.ITSTL2.passOrFail,
          });
        }
        if (s.result.IMOL2.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IMOL2: s.IMOL2,
            passOrFail: s.result.IMOL2.passOrFail,
          });
        }

        if (s.result.IENGOL2.marksObtained != undefined) {
          studentData.push({
            studentName: s.studentName,
            rollNo: s.rollNo,
            class: s.class,
            schoolCode: s.schoolCode,
            IENGOL2: s.IENGOL2,
            passOrFail: s.result.IENGOL2.passOrFail,
          });
        }
      }
    });

  const schoolName= await School.findOne({
      schoolCode: schoolCode
    })
    console.log("Student Data:", studentData);
    res.status(200).json({studentData:studentData ,school:schoolName});

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
