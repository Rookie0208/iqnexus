import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";
import { dbConnection, uploadAdmitCard, generateAdmitCard, fetchAdmitCardFromDB } from "../services/admitCardService.js";
import { ObjectId } from "mongodb";

const studentCache = {};

export const getAdmitCardStudents = async (req, res) => {
  try {
    const { schoolCode, examLevel } = req.body;
    const { page = 1, limit = 10 } = req.query;

    if (schoolCode && isNaN(parseInt(schoolCode))) {
      return res.status(400).json({ error: "Invalid school code: must be a number" });
    }

    if (examLevel && !["L1", "L2"].includes(examLevel)) {
      return res.status(400).json({ error: "Invalid exam level: must be L1 or L2" });
    }

    const query = { schoolCode: parseInt(schoolCode) };
    if (examLevel === "L1") {
      query.$or = [
        { IAOL1: "1" }, { ITSTL1: "1" }, { IMOL1: "1" },
        { IGKOL1: "1" }, { IENGOL1: "1" }
      ];
    } else if (examLevel === "L2") {
      query.$or = [
        { IAOL2: "1" }, { ITSTL2: "1" }, { IMOL2: "1" },
        { IENGOL2: "1" }
      ];
    }

    const totalStudents = await STUDENT_LATEST.countDocuments(query);
    const students = await STUDENT_LATEST.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("rollNo schoolCode class section dob mobNo studentName IAOL1 ITSTL1 IMOL1 IGKOL1 IENGOL1 IAOL2 ITSTL2 IMOL2 IENGOL2");

    const totalPages = Math.ceil(totalStudents / limit);

    return res.status(200).json({
      success: true,
      data: students,
      totalPages,
      currentPage: Number(page),
      totalStudents,
    });
  } catch (error) {
    console.error("❌ Error in admit-card-students route:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateAdmitCards = async (req, res) => {
  const { schoolCode, level, examDate } = req.body;
  if (!schoolCode || !level || !examDate) {
    return res.status(400).json({ error: "School code, level, and exam date are required" });
  }

  try {
    const school = await School.findOne({ schoolCode });
    const dbResponse = await dbConnection();
    if (dbResponse.status !== "success") {
      return res.status(500).json({ error: "Database connection failed" });
    }
    const db = dbResponse.conn.db;

    const query = {
      schoolCode: Number(schoolCode),
      ...(level === "L1" && {
        $or: [{ IAOL1: "1" }, { ITSTL1: "1" }, { IMOL1: "1" }, { IGKOL1: "1" }, { IENGOL1: "1" }]
      }),
      ...(level === "L2" && {
        $or: [{ IAOL2: "1" }, { ITSTL2: "1" }, { IMOL2: "1" }, { IGKOL2: "1" }, { IENGOL2: "1" }]
      })
    };

    const students = await STUDENT_LATEST.find(query).lean();

    const uniqueStudents = [];
    const seenMobNos = new Set();
    for (const student of students) {
      if (!seenMobNos.has(student.mobNo)) {
        uniqueStudents.push(student);
        seenMobNos.add(student.mobNo);
      }
    }

    const cachedStudents = uniqueStudents.map((student) => {
      const studentData = studentCache[student.mobNo] || student;
      studentCache[student.mobNo] = studentData;
      return studentData;
    });

    const generateResults = await generateAdmitCard(cachedStudents, level, examDate, school);
    const uploadResults = await uploadAdmitCard(cachedStudents, level, db, examDate);

    const results = generateResults.map((gen, index) => ({
      mobNo: gen.mobNo,
      success: gen.success && uploadResults[index].success,
      path: gen.path,
      fileId: uploadResults[index].fileId,
      error: gen.error || uploadResults[index].error,
      message: uploadResults[index].message,
    }));

    const failed = results.filter((r) => r.error);
    const alreadyGenerated = results.filter((r) => r.message === "Admit card already generated");

    if (failed.length > 0) {
      return res.status(207).json({ message: "Some admit cards failed", results });
    }

    if (alreadyGenerated.length === results.length) {
      return res.status(200).json({ message: "All admit cards were already generated", results });
    }

    return res.status(200).json({ message: "All admit cards generated and stored successfully", results });
  } catch (error) {
    console.error("Error generating admit cards:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchAdmitCardByPhone = async (req, res) => {
  const { phone } = req.params;
  const dbResponse = await dbConnection();
  if (dbResponse.status !== "success") {
    return res.status(500).json({ error: "Database connection failed" });
  }

  try {
    const admitcard = await dbResponse.conn.db
      .collection("admitCards.files")
      .findOne({ "metadata.mobNo": phone });

    if (!admitcard) return res.status(404).json({ error: "Admit card not found" });
    return res.status(200).json({ result: admitcard });
  } catch (error) {
    console.error("Error fetching admit card:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchAdmitCardForStudent = async (req, res) => {
  try {
    const { mobNo, level } = req.body;
    const Level = level === "basic" ? "L1" : "L2";
    if (!mobNo || !["L1", "L2"].includes(Level)) {
      return res.status(400).json({ error: "Mobile number and valid level (basic/L1 or L2) are required" });
    }

    const studentData = await STUDENT_LATEST.findOne({ mobNo }).lean();
    if (!studentData) return res.status(404).json({ error: "Student not found" });

    const objectId = new ObjectId(studentData._id);
    await fetchAdmitCardFromDB(objectId, studentData.studentName, Level, res);
  } catch (error) {
    console.error("Error processing request:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process request" });
    }
  }
};
