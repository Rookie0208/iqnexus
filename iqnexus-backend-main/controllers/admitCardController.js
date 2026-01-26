import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";
import { dbConnection, uploadAdmitCard, generateAdmitCard, fetchAdmitCardFromDB } from "../services/admitCardService.js";
import { ObjectId, GridFSBucket } from "mongodb";

const studentCache = {};

export const getAdmitCardStudents = async (req, res) => {
  try {
    const { schoolCode, examLevel } = req.body;
    const { page = 1, limit = 10 } = req.query;

    // Validate required fields
    if (!schoolCode) {
      return res.status(400).json({ error: "School code is required" });
    }

    if (!examLevel) {
      return res.status(400).json({ error: "Exam level is required" });
    }

    if (isNaN(parseInt(schoolCode))) {
      return res.status(400).json({ error: "Invalid school code: must be a number" });
    }

    if (!["L1", "L2"].includes(examLevel)) {
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

    console.log("🔍 Query for admit card students:", JSON.stringify(query, null, 2));

    // Query regular students
    const regularStudents = await STUDENT_LATEST.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("rollNo schoolCode class section dob mobNo studentName IAOL1 ITSTL1 IMOL1 IGKOL1 IENGOL1 IAOL2 ITSTL2 IMOL2 IENGOL2")
      .lean();

    // Query kindergarten students
    const kgQuery = { schoolCode: parseInt(schoolCode) };
    if (examLevel === "L1") {
      kgQuery.IQKD1 = "1";
    } else if (examLevel === "L2") {
      kgQuery.IQKD2 = "1";
    }

    console.log("🔍 KG Query:", JSON.stringify(kgQuery, null, 2));

    const kgStudents = await KINDERGARTEN_STUDENT.find(kgQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("rollNo schoolCode class section dob mobNo studentName IQKD1 IQKD2")
      .lean();

    console.log("📊 Regular students found:", regularStudents.length);
    console.log("📊 KG students found:", kgStudents.length);

    // Combine both results
    const students = [...regularStudents, ...kgStudents];
    
    // Get total count from both collections
    const totalRegular = await STUDENT_LATEST.countDocuments(query);
    const totalKG = await KINDERGARTEN_STUDENT.countDocuments(kgQuery);
    const totalStudents = totalRegular + totalKG;

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

    // Query for regular students
    const query = {
      schoolCode: Number(schoolCode),
      ...(level === "L1" && {
        $or: [{ IAOL1: "1" }, { ITSTL1: "1" }, { IMOL1: "1" }, { IGKOL1: "1" }, { IENGOL1: "1" }]
      }),
      ...(level === "L2" && {
        $or: [{ IAOL2: "1" }, { ITSTL2: "1" }, { IMOL2: "1" }, { IGKOL2: "1" }, { IENGOL2: "1" }]
      })
    };

    const regularStudents = await STUDENT_LATEST.find(query).lean();

    // Query for kindergarten students
    const kgQuery = { schoolCode: Number(schoolCode) };
    if (level === "L1") {
      kgQuery.IQKD1 = "1";
    } else if (level === "L2") {
      kgQuery.IQKD2 = "1";
    }

    const kgStudents = await KINDERGARTEN_STUDENT.find(kgQuery).lean();

    console.log(`📊 Generating admit cards - Regular: ${regularStudents.length}, KG: ${kgStudents.length}`);

    // Combine both student types
    const allStudents = [...regularStudents, ...kgStudents];

    if (allStudents.length === 0) {
      return res.status(404).json({ error: "No students found for the selected criteria" });
    }

    const uniqueStudents = [];
    const seenMobNos = new Set();
    for (const student of allStudents) {
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

    // Try to find student in regular students collection
    let studentData = await STUDENT_LATEST.findOne({ mobNo }).lean();
    
    // If not found, try kindergarten collection
    if (!studentData) {
      studentData = await KINDERGARTEN_STUDENT.findOne({ mobNo }).lean();
    }
    
    if (!studentData) {
      return res.status(404).json({ error: "Student not found" });
    }

    const objectId = new ObjectId(studentData._id);
    await fetchAdmitCardFromDB(objectId, studentData.studentName, Level, res);
  } catch (error) {
    console.error("Error processing request:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process request" });
    }
  }
};

// Get list of all generated admit cards with filters
export const getGeneratedAdmitCards = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { schoolCode, examLevel, rollNo } = req.body;

    const dbResponse = await dbConnection();
    if (dbResponse.status !== "success") {
      return res.status(500).json({ error: "Database connection failed" });
    }
    const db = dbResponse.conn.db;

    // Build query for GridFS files
    let query = {};
    
    // Filter by exam level (L1 or L2 in filename)
    if (examLevel) {
      query.filename = { $regex: `-${examLevel}-`, $options: "i" };
    }

    // Get all admit card files
    let files = await db
      .collection("admitCards.files")
      .find(query)
      .sort({ uploadDate: -1 })
      .toArray();

    // Filter by rollNo if provided (need to fetch student data)
    if (rollNo || schoolCode) {
      // Get student IDs from filename and filter
      const filteredFiles = [];
      
      for (const file of files) {
        // Extract student ID from filename: admitCard_StudentName-L1-studentId.pdf
        const filenameMatch = file.filename.match(/admitCard_.*-L[12]-([a-f0-9]+)\.pdf/i);
        if (!filenameMatch) continue;
        
        const studentId = filenameMatch[1];
        
        // Find student in both collections
        let student = await STUDENT_LATEST.findById(studentId).lean();
        if (!student) {
          student = await KINDERGARTEN_STUDENT.findById(studentId).lean();
        }
        
        if (!student) continue;
        
        // Apply filters
        if (rollNo && !student.rollNo?.toString().includes(rollNo)) continue;
        if (schoolCode && student.schoolCode !== parseInt(schoolCode)) continue;
        
        filteredFiles.push({
          ...file,
          student: {
            studentName: student.studentName,
            rollNo: student.rollNo,
            schoolCode: student.schoolCode,
            class: student.class,
            section: student.section,
            mobNo: student.mobNo,
          }
        });
      }
      files = filteredFiles;
    } else {
      // Enrich files with student data
      const enrichedFiles = [];
      for (const file of files) {
        const filenameMatch = file.filename.match(/admitCard_.*-L[12]-([a-f0-9]+)\.pdf/i);
        if (!filenameMatch) {
          enrichedFiles.push(file);
          continue;
        }
        
        const studentId = filenameMatch[1];
        let student = await STUDENT_LATEST.findById(studentId).lean();
        if (!student) {
          student = await KINDERGARTEN_STUDENT.findById(studentId).lean();
        }
        
        enrichedFiles.push({
          ...file,
          student: student ? {
            studentName: student.studentName,
            rollNo: student.rollNo,
            schoolCode: student.schoolCode,
            class: student.class,
            section: student.section,
            mobNo: student.mobNo,
          } : null
        });
      }
      files = enrichedFiles;
    }

    // Pagination
    const totalFiles = files.length;
    const totalPages = Math.ceil(totalFiles / parseInt(limit));
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedFiles = files.slice(startIndex, startIndex + parseInt(limit));

    // Extract level from filename for each file
    const filesWithLevel = paginatedFiles.map(file => {
      const levelMatch = file.filename.match(/-(L[12])-/);
      return {
        _id: file._id,
        filename: file.filename,
        uploadDate: file.uploadDate,
        length: file.length,
        examLevel: levelMatch ? levelMatch[1] : "Unknown",
        student: file.student || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: filesWithLevel,
      totalFiles,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("❌ Error fetching generated admit cards:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download/Preview admit card by file ID
export const downloadAdmitCardById = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }

    const dbResponse = await dbConnection();
    if (dbResponse.status !== "success") {
      return res.status(500).json({ error: "Database connection failed" });
    }
    const db = dbResponse.conn.db;
    const gfs = new GridFSBucket(db, { bucketName: "admitCards" });

    // Check if file exists
    const file = await db.collection("admitCards.files").findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: "Admit card not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    
    const readStream = gfs.openDownloadStream(new ObjectId(fileId));
    readStream.pipe(res);
    
    readStream.on("error", (err) => {
      console.error("Error streaming file:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file" });
      }
    });
  } catch (error) {
    console.error("❌ Error downloading admit card:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};
