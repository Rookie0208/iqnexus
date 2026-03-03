import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";
import { ResultConfig } from "../models/resultConfigModel.js";
import { Subject } from "../models/subjectModel.js";
import mongoose from "mongoose";
import fs from "fs";
import xlsx from "xlsx";

// Exam code mapping from display codes to internal field names
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
  // KG exams map to themselves
  IQKD1: "IQKD1",
  IQKD2: "IQKD2",
};

// Check if an exam code is a kindergarten exam
const isKGExam = (subject) => ["IQKD1", "IQKD2"].includes(subject);

// Get the appropriate model based on student class
const getStudentModel = (studentClass) => {
  return studentClass === "KD" ? KINDERGARTEN_STUDENT : STUDENT_LATEST;
};

/**
 * Upload detailed results with section-wise breakdown
 * Template columns:
 * ROLL NO, ATTENDANCE, CLASS, SECTION,
 * S1_Score, S1_Percentage, S1_CorrectQCount, S1_TotalQCount, S1_UnAttempted,
 * S2_Score, S2_Percentage, S2_CorrectQCount, S2_TotalQCount, S2_UnAttempted,
 * S3_Score, S3_Percentage, S3_CorrectQCount, S3_TotalQCount, S3_UnAttempted,
 * S4_Score, S4_Percentage, S4_CorrectQCount, S4_TotalQCount, S4_UnAttempted,
 * S5_Score, S5_Percentage, S5_CorrectQCount, S5_TotalQCount, S5_UnAttempted,
 * Total_Score, Total_Rank, Total_Percentage, Total_CorrectQCount, Total_TotalQCount, Total_UnAttempted
 */
export const uploadResult = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // Read workbook from buffer
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Parse sheet to JSON
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validate file format - check for required columns
    if (!data || data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "File is empty. No data found." });
    }
    const fileColumns = Object.keys(data[0]);
    const requiredResultColumns = ["ROLL NO", "ATTENDANCE", "S1_Score", "Total_Score"];
    // Check case-insensitively
    const fileColumnsLower = fileColumns.map(c => c.toLowerCase());
    const missingColumns = requiredResultColumns.filter(c => 
      !fileColumnsLower.includes(c.toLowerCase())
    );
    if (missingColumns.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: `Invalid file format. Missing required columns: ${missingColumns.join(", ")}. ` +
          `Expected columns: ROLL NO, ATTENDANCE, CLASS, SECTION, S1_Score, S1_Percentage, S1_CorrectQCount, S1_TotalQCount, S1_UnAttempted, ... Total_Score, Total_Rank, Total_Percentage, etc. ` +
          `Please download the result template and use the correct format.`
      });
    }

    const { subject, studentClass, schoolCode, examLevel } = req.body;

    if (!subject) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Subject is required" });
    }

    // Determine if class and schoolCode were provided (flexible mode when absent)
    const hasClassAndSchool = studentClass && schoolCode;

    // Map exam code to internal field name (e.g., IQMOL1 -> IMOL1, IQKD1 -> IQKD1)
    const resultKey = examFieldMap[subject] || subject;

    // When class & schoolCode are provided, run batch-level pre-validations (original behavior)
    if (hasClassAndSchool) {
      const school = await School.findOne({ schoolCode: Number(schoolCode) });
      if (!school) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: `School with code ${schoolCode} does not exist. Please add the school first.` });
      }

      const isKG = studentClass === "KD";
      const StudentModel = getStudentModel(studentClass);

      // Validate students exist for this school + class
      const studentQuery = isKG 
        ? { schoolCode: Number(schoolCode), class: "KD" }
        : { schoolCode: Number(schoolCode), class: studentClass };
      const studentCount = await StudentModel.countDocuments(studentQuery);
      if (studentCount === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ 
          error: `No ${isKG ? 'kindergarten ' : ''}students found for school ${schoolCode} (${school.schoolName || ''})${isKG ? '' : ` in class ${studentClass}`}. Please upload student data first before uploading results.` 
        });
      }

      // Check if admit cards have been generated for this school (skip for KG students)
      if (!isKG) {
      try {
        const db = mongoose.connection.db;
        const admitCardFiles = db.collection('admitCards.files');
        const schoolStudents = await STUDENT_LATEST.find({
          schoolCode: Number(schoolCode),
          class: studentClass,
        }).select('studentName _id').limit(3).lean();
        
        if (schoolStudents.length > 0) {
          const sampleStudent = schoolStudents[0];
          const studentAdmitCard = await admitCardFiles.countDocuments({
            filename: { $regex: sampleStudent._id.toString() }
          });
          if (studentAdmitCard === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ 
              error: `Admit cards have not been generated for students of school ${schoolCode} (${school.schoolName || ''}). Please generate admit cards before uploading results.` 
            });
          }
        }
      } catch (gridfsErr) {
        console.warn('Could not check admit cards:', gridfsErr.message);
        // Don't block result upload on GridFS errors - just warn and continue
      }
      }
    } else {
      console.log(`📊 Flexible mode: class/schoolCode not provided, will lookup each student by rollNo`);
    }

    console.log(`📊 Processing ${data.length} result records for ${resultKey}`);

    // Get configurable qualifying percentage (instead of hardcoded 40%)
    let qualifyingPercentage = 40; // default fallback
    try {
      const config = await ResultConfig.findOne({ subject, batchId: "2024-25" });
      if (config?.qualifyingPercentage != null) {
        qualifyingPercentage = config.qualifyingPercentage;
      } else {
        const subjectDoc = await Subject.findOne({ code: subject }).lean();
        if (subjectDoc?.qualificationRules?.qualifyingPercentage != null) {
          qualifyingPercentage = subjectDoc.qualificationRules.qualifyingPercentage;
        }
      }
    } catch (qErr) {
      console.warn("Could not fetch qualifying percentage, using default:", qErr.message);
    }
    console.log(`📊 Using qualifying percentage: ${qualifyingPercentage}%`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const rollNo = String(row["ROLL NO"] || row["roll no"] || row["Roll No"] || "").trim();
        const attendance = String(row["ATTENDANCE"] || row["Attendance"] || "PRESENT").toUpperCase();

        if (!rollNo) {
          errorCount++;
          errors.push({ row, error: "Missing roll number" });
          continue;
        }

        // Helper to read a column with fallback names (handles both "CorrectQCount" and "CorrectCount" variants)
        const readCol = (row, ...keys) => {
          for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
              return Number(row[key]) || 0;
            }
          }
          return 0;
        };

        // Parse section-wise data (support both "QCount" and "Count" column name variants)
        const section1 = {
          score: readCol(row, "S1_Score"),
          percentage: readCol(row, "S1_Percentage"),
          correctCount: readCol(row, "S1_CorrectQCount", "S1_CorrectCount"),
          totalCount: readCol(row, "S1_TotalQCount", "S1_TotalCount"),
          unAttempted: readCol(row, "S1_UnAttempted"),
        };

        const section2 = {
          score: readCol(row, "S2_Score"),
          percentage: readCol(row, "S2_Percentage"),
          correctCount: readCol(row, "S2_CorrectQCount", "S2_CorrectCount"),
          totalCount: readCol(row, "S2_TotalQCount", "S2_TotalCount"),
          unAttempted: readCol(row, "S2_UnAttempted"),
        };

        const section3 = {
          score: readCol(row, "S3_Score"),
          percentage: readCol(row, "S3_Percentage"),
          correctCount: readCol(row, "S3_CorrectQCount", "S3_CorrectCount"),
          totalCount: readCol(row, "S3_TotalQCount", "S3_TotalCount"),
          unAttempted: readCol(row, "S3_UnAttempted"),
        };

        const section4 = {
          score: readCol(row, "S4_Score"),
          percentage: readCol(row, "S4_Percentage"),
          correctCount: readCol(row, "S4_CorrectQCount", "S4_CorrectCount"),
          totalCount: readCol(row, "S4_TotalQCount", "S4_TotalCount"),
          unAttempted: readCol(row, "S4_UnAttempted"),
        };

        const section5 = {
          score: readCol(row, "S5_Score"),
          percentage: readCol(row, "S5_Percentage"),
          correctCount: readCol(row, "S5_CorrectQCount", "S5_CorrectCount"),
          totalCount: readCol(row, "S5_TotalQCount", "S5_TotalCount"),
          unAttempted: readCol(row, "S5_UnAttempted"),
        };

        const total = {
          score: readCol(row, "Total_Score"),
          rank: readCol(row, "Total_Rank"),
          percentage: readCol(row, "Total_Percentage"),
          correctCount: readCol(row, "Total_CorrectQCount", "Total_CorrectCount"),
          totalCount: readCol(row, "Total_TotalQCount", "Total_TotalCount"),
          unAttempted: readCol(row, "Total_UnAttempted"),
        };

        // Validate: log warning if Total_Percentage doesn't match sum of section percentages
        const computedSumPct = section1.percentage + section2.percentage + section3.percentage + section4.percentage + section5.percentage;
        if (total.percentage > 0 && computedSumPct > 0 && Math.abs(total.percentage - computedSumPct) > 1) {
          console.warn(`⚠️ Roll ${rollNo}: Total_Percentage (${total.percentage}) differs from sum of section percentages (${computedSumPct})`);
        }

        // Determine pass/fail based on attendance and qualifying percentage
        let passOrFail = "FAIL";
        if (attendance === "PRESENT" && total.percentage >= qualifyingPercentage) {
          passOrFail = "PASS";
        } else if (attendance === "ABSENT" || attendance === "DISQUALIFIED") {
          passOrFail = attendance;
        }

        // Update student record
        let updateResult = null;

        if (hasClassAndSchool) {
          // Original mode: use form-provided class & schoolCode
          const isKG = studentClass === "KD";
          const StudentModel = getStudentModel(studentClass);
          const findQuery = isKG
            ? { rollNo: rollNo, class: "KD", schoolCode: Number(schoolCode) }
            : { rollNo: rollNo, class: studentClass, schoolCode: Number(schoolCode) };
          
          updateResult = await StudentModel.findOneAndUpdate(
            findQuery,
            {
              $set: {
                [`result.${resultKey}.attendance`]: attendance,
                [`result.${resultKey}.section1`]: section1,
                [`result.${resultKey}.section2`]: section2,
                [`result.${resultKey}.section3`]: section3,
                [`result.${resultKey}.section4`]: section4,
                [`result.${resultKey}.section5`]: section5,
                [`result.${resultKey}.total`]: total,
                [`result.${resultKey}.passOrFail`]: passOrFail,
              },
            },
            { new: true }
          );
        } else {
          // Flexible mode: lookup by rollNo alone, try regular students first then KG
          let student = await STUDENT_LATEST.findOne({ rollNo }).lean();
          let model = STUDENT_LATEST;

          if (!student) {
            student = await KINDERGARTEN_STUDENT.findOne({ rollNo }).lean();
            model = KINDERGARTEN_STUDENT;
          }

          if (student) {
            updateResult = await model.findOneAndUpdate(
              { rollNo },
              {
                $set: {
                  [`result.${resultKey}.attendance`]: attendance,
                  [`result.${resultKey}.section1`]: section1,
                  [`result.${resultKey}.section2`]: section2,
                  [`result.${resultKey}.section3`]: section3,
                  [`result.${resultKey}.section4`]: section4,
                  [`result.${resultKey}.section5`]: section5,
                  [`result.${resultKey}.total`]: total,
                  [`result.${resultKey}.passOrFail`]: passOrFail,
                },
              },
              { new: true }
            );
          }
        }

        if (updateResult) {
          successCount++;
        } else {
          errorCount++;
          errors.push({ rollNo, error: "Student not found" });
        }
      } catch (rowError) {
        errorCount++;
        errors.push({ row, error: rowError.message });
      }
    }

    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    console.log(`✅ Results uploaded: ${successCount} success, ${errorCount} errors`);

    res.status(200).json({
      message: "Results uploaded successfully",
      summary: {
        totalProcessed: data.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Return first 10 errors only
      },
    });
  } catch (error) {
    console.error("❌ Error uploading results:", error);
    res.status(500).json({ error: "Failed to upload results", details: error.message });
  }
};

/**
 * Upload results using simple format (backward compatible)
 * Template columns: roll no, marks obtained, total marks, pass or fail
 */
export const uploadResultSimple = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validate file format - check for required columns
    if (!data || data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "File is empty. No data found." });
    }
    const fileColumns = Object.keys(data[0]);
    const requiredSimpleColumns = ["roll no", "marks obtained", "total marks", "pass or fail"];
    const fileColumnsLower = fileColumns.map(c => c.toLowerCase());
    const missingSimpleCols = requiredSimpleColumns.filter(c => 
      !fileColumnsLower.includes(c)
    );
    if (missingSimpleCols.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: `Invalid file format. Missing required columns: ${missingSimpleCols.join(", ")}. ` +
          `Expected columns: roll no, marks obtained, total marks, pass or fail. ` +
          `Please download the result template and use the correct format.`
      });
    }

    const { subject, studentClass, schoolCode } = req.body;

    if (!subject || !studentClass || !schoolCode) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Subject, class, and school code are required" });
    }

    // Validate school exists
    const school = await School.findOne({ schoolCode: Number(schoolCode) });
    if (!school) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: `School with code ${schoolCode} does not exist. Please add the school first.` });
    }

    const isKG = studentClass === "KD";
    const StudentModel = getStudentModel(studentClass);

    // Validate students exist for this school + class
    const studentQuery = isKG 
      ? { schoolCode: Number(schoolCode), class: "KD" }
      : { schoolCode: Number(schoolCode), class: studentClass };
    const studentCount = await StudentModel.countDocuments(studentQuery);
    if (studentCount === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: `No ${isKG ? 'kindergarten ' : ''}students found for school ${schoolCode} (${school.schoolName || ''})${isKG ? '' : ` in class ${studentClass}`}. Please upload student data first before uploading results.` 
      });
    }

    const resultKey = examFieldMap[subject] || subject;

    // Check if admit cards have been generated for this school (skip for KG students)
    if (!isKG) {
    try {
      const db = mongoose.connection.db;
      const admitCardFiles = db.collection('admitCards.files');
      const schoolStudents = await STUDENT_LATEST.find({
        schoolCode: Number(schoolCode),
        class: studentClass,
      }).select('_id').limit(3).lean();
      
      if (schoolStudents.length > 0) {
        const sampleStudent = schoolStudents[0];
        const studentAdmitCard = await admitCardFiles.countDocuments({
          filename: { $regex: sampleStudent._id.toString() }
        });
        if (studentAdmitCard === 0) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ 
            error: `Admit cards have not been generated for students of school ${schoolCode} (${school.schoolName || ''}). Please generate admit cards before uploading results.` 
          });
        }
      }
    } catch (gridfsErr) {
      console.warn('Could not check admit cards:', gridfsErr.message);
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: `Admit cards have not been generated yet. Please generate admit cards before uploading results.` 
      });
    }
    }

    let successCount = 0;

    for (const row of data) {
      const rollNo = row["roll no"];
      const marksObtained = Number(row["marks obtained"]);
      const totalMarks = Number(row["total marks"]);
      const passOrFail = row["pass or fail"];

      if (!rollNo || isNaN(marksObtained) || isNaN(totalMarks)) continue;

      const findQuery = isKG
        ? { rollNo: rollNo, class: "KD", schoolCode: Number(schoolCode) }
        : { rollNo: rollNo, class: studentClass, schoolCode: Number(schoolCode) };

      const updateResult = await StudentModel.findOneAndUpdate(
        findQuery,
        {
          $set: {
            [`result.${resultKey}.attendance`]: "PRESENT",
            [`result.${resultKey}.total.score`]: marksObtained,
            [`result.${resultKey}.total.totalCount`]: totalMarks,
            [`result.${resultKey}.total.percentage`]: ((marksObtained / totalMarks) * 100).toFixed(2),
            [`result.${resultKey}.passOrFail`]: passOrFail,
          },
        },
        { new: true }
      );
      if (updateResult) {
        successCount++;
      }
    }

    fs.unlinkSync(filePath);

    res.status(200).json({ message: "Results uploaded successfully", successCount });
  } catch (error) {
    console.error("❌ Error uploading results:", error);
    res.status(500).json({ error: "Failed to upload results", details: error.message });
  }
};

export const getResult = async (req, res) => {
  const { rollNo, class: studentClass } = req.query;
  if (!rollNo || !studentClass) {
    return res
      .status(400)
      .json({ error: "Roll number and class are required" });
  }
  try {
    const StudentModel = getStudentModel(studentClass);
    const student = await StudentModel.findOne(
      {
        rollNo: rollNo,
        class: studentClass,
      },
      { result: 1, _id: 0 }
    );
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json(student.result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all results with filters for admin panel
 * Filters: school, class, section, subject, rollNo (search)
 * Sorting: score, internationalRank, nationalRank, cityRank, schoolRank, classRank, sectionRank
 * Only shows students who have:
 * 1. Registered for the exam (exam field = "1")
 * 2. Have result data with attendance = "PRESENT"
 */
export const getAllResults = async (req, res) => {
  try {
    const { 
      schoolCode, 
      studentClass, 
      section, 
      subject, 
      rollNo,
      sortBy = 'total.score',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    // Get the result field key for the subject
    const resultKey = subject ? (examFieldMap[subject] || subject) : null;

    if (!resultKey) {
      return res.status(400).json({ error: "Subject is required" });
    }

    const isKG = isKGExam(subject);
    const StudentModel = isKG ? KINDERGARTEN_STUDENT : STUDENT_LATEST;

    // Check if exam config exists for this subject
    const { ResultConfig } = await import("../models/resultConfigModel.js");
    // Try universal "all" config first, then fall back to any class-specific config
    let examConfig = await ResultConfig.findOne({ 
      subject, 
      classLevel: "all",
      batchId: "2024-25"
    });
    if (!examConfig) {
      examConfig = await ResultConfig.findOne({ 
        subject,
        batchId: "2024-25"
      });
    }

    // Build query
    const query = {};
    
    if (schoolCode && schoolCode !== 'all') {
      query.schoolCode = Number(schoolCode);
    }
    
    if (isKG) {
      query.class = "KD";
    } else if (studentClass && studentClass !== 'all') {
      query.class = studentClass;
    }
    
    if (section && section !== 'all') {
      query.section = section;
    }
    
    if (rollNo) {
      query.rollNo = { $regex: rollNo, $options: 'i' };
    }

    // Show only students who actually have result data uploaded
    query[`result.${resultKey}.total.score`] = { $exists: true };

    // For non-KG students, filter by admit cards
    if (!isKG) {
    // Get list of student IDs/mobNos that have admit cards generated
    const mongooseModule = await import("mongoose");
    const db = mongooseModule.default.connection.db;
    const admitCardsCollection = db.collection("admitCards.files");
    
    // Get all mobile numbers from admit cards
    const admitCards = await admitCardsCollection.find({}).project({ "metadata.mobNo": 1 }).toArray();
    const admitCardMobNos = admitCards.map(ac => ac.metadata?.mobNo).filter(Boolean);
    
    // Filter to only students who have admit cards
    if (admitCardMobNos.length > 0) {
      query.mobNo = { $in: admitCardMobNos };
    } else {
      // No admit cards exist at all - return warning
      return res.status(200).json({
        success: true,
        data: [],
        noAdmitCards: true,
        message: "No admit cards have been generated yet. Please generate admit cards first before viewing or uploading results.",
        hasExamConfig: !!examConfig,
        examConfig: examConfig ? {
          topicNames: examConfig.topicNames,
          isPublished: examConfig.isPublished
        } : null,
        pagination: {
          currentPage: Number(page),
          totalPages: 0,
          totalCount: 0,
          limit: Number(limit)
        }
      });
    }
    }

    // Build the projection
    const projection = {
      rollNo: 1,
      "Student's Name": 1,
      "Father's Name": 1,
      studentName: 1,
      fatherName: 1,
      class: 1,
      section: 1,
      schoolCode: 1,
      school: 1,
      city: 1,
      country: 1,
      _id: 1
    };

    // Include the result for this subject
    projection[`result.${resultKey}`] = 1;
    // Include the exam registration field
    projection[resultKey] = 1;

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count for pagination
    const totalCount = await StudentModel.countDocuments(query);

    // Build sort object
    let sortField = sortBy;
    if (resultKey && sortBy.startsWith('total.')) {
      sortField = `result.${resultKey}.${sortBy}`;
    } else if (resultKey && ['internationalRank', 'nationalRank', 'cityRank', 'schoolRank', 'classRank', 'sectionRank'].includes(sortBy)) {
      sortField = `result.${resultKey}.ranks.${sortBy}`;
    }
    
    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Fetch results
    const students = await StudentModel.find(query, projection)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get all school info for city/country lookups
    const schoolCodes = [...new Set(students.map(s => s.schoolCode))];
    const schools = await School.find({ schoolCode: { $in: schoolCodes } }).lean();
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.schoolCode] = s; });

    // Helper function to calculate rank using database count (accurate global rank)
    const calculateGlobalRank = async (studentScore, additionalQuery = {}) => {
      if (studentScore <= 0) return 0;
      const higherCount = await StudentModel.countDocuments({
        ...additionalQuery,
        [`result.${resultKey}.attendance`]: "PRESENT",
        [`result.${resultKey}.total.score`]: { $gt: studentScore }
      });
      return higherCount + 1;
    };

    // Transform results for display with calculated ranks
    const results = await Promise.all(students.map(async (student) => {
      const resultData = resultKey ? student.result?.[resultKey] : null;
      const studentScore = resultData?.total?.score ?? 0;
      const schoolInfo = schoolMap[student.schoolCode] || {};
      const studentCity = schoolInfo.city || student.city || '';
      const studentCountry = schoolInfo.country || 'INDIA';
      
      // Get school codes for city and country for rank calculation
      let citySchoolCodes = [];
      let countrySchoolCodes = [];
      
      if (studentCity) {
        const citySchools = await School.find({ city: studentCity }).distinct('schoolCode');
        citySchoolCodes = citySchools;
      }
      
      if (studentCountry) {
        const countrySchools = await School.find({ country: studentCountry }).distinct('schoolCode');
        countrySchoolCodes = countrySchools;
      }

      // Calculate all ranks in parallel for performance
      // Only calculate ranks for PRESENT students - ABSENT students get 0 ranks
      let intlRank = 0, nationalRank = 0, cityRank = 0, schoolRank = 0, classRank = 0, sectionRank = 0;
      
      if (resultData?.attendance === "PRESENT" && studentScore > 0) {
        [intlRank, nationalRank, cityRank, schoolRank, classRank, sectionRank] = await Promise.all([
          // International Rank - All students globally
          calculateGlobalRank(studentScore, {}),
          // National Rank - Same country
          countrySchoolCodes.length > 0 
            ? calculateGlobalRank(studentScore, { schoolCode: { $in: countrySchoolCodes } })
            : Promise.resolve(0),
          // City Rank - Same city
          citySchoolCodes.length > 0 
            ? calculateGlobalRank(studentScore, { schoolCode: { $in: citySchoolCodes } })
            : Promise.resolve(0),
          // School Rank
          calculateGlobalRank(studentScore, { schoolCode: student.schoolCode }),
          // Class Rank
          calculateGlobalRank(studentScore, { schoolCode: student.schoolCode, class: student.class }),
          // Section Rank
          calculateGlobalRank(studentScore, { schoolCode: student.schoolCode, class: student.class, section: student.section })
        ]);
      }

      return {
        rollNo: student.rollNo,
        studentName: student["Student's Name"] || student.studentName,
        fatherName: student["Father's Name"] || student.fatherName,
        studentClass: student.class,
        section: student.section,
        schoolCode: student.schoolCode,
        schoolName: schoolInfo.schoolName || student.school,
        city: studentCity,
        country: studentCountry,
        subject: subject || 'N/A',
        examDate: resultData?.examDate || '',
        attendance: resultData?.attendance || 'N/A',
        score: studentScore,
        percentage: resultData?.total?.percentage ?? 0,
        correctCount: resultData?.total?.correctCount ?? 0,
        totalCount: resultData?.total?.totalCount ?? 0,
        unAttempted: resultData?.total?.unAttempted ?? 0,
        rank: resultData?.total?.rank ?? 0,
        // Calculated ranks from database
        internationalRank: intlRank,
        nationalRank: nationalRank,
        cityRank: cityRank,
        schoolRank: schoolRank,
        classRank: classRank,
        sectionRank: sectionRank,
        passOrFail: resultData?.passOrFail || 'N/A',
        prize: resultData?.prize || '',
        // Section-wise data
        section1: resultData?.section1 || null,
        section2: resultData?.section2 || null,
        section3: resultData?.section3 || null,
        section4: resultData?.section4 || null,
        section5: resultData?.section5 || null,
      };
    }));

    res.status(200).json({
      success: true,
      data: results,
      hasExamConfig: !!examConfig,
      examConfig: examConfig ? {
        topicNames: examConfig.topicNames,
        isPublished: examConfig.isPublished
      } : null,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching all results:", error);
    res.status(500).json({ error: "Failed to fetch results", details: error.message });
  }
};

/**
 * Get unique schools list for filter dropdown
 */
export const getSchoolsForFilter = async (req, res) => {
  try {
    // Get schools directly from School collection
    const schools = await School.find({}, { schoolCode: 1, schoolName: 1, _id: 0 })
      .sort({ schoolName: 1 })
      .lean();

    // Filter out entries with missing data
    const validSchools = schools.filter(s => s.schoolCode && s.schoolName);

    res.status(200).json({ success: true, schools: validSchools });
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({ error: "Failed to fetch schools" });
  }
};

/**
 * Export results to Excel
 */
export const exportResultsToExcel = async (req, res) => {
  try {
    const { 
      schoolCode, 
      studentClass, 
      section, 
      subject, 
      rollNo,
      sortBy = 'total.score',
      sortOrder = 'desc'
    } = req.query;

    // Build query (same as getAllResults)
    const query = {};
    
    if (schoolCode && schoolCode !== 'all') {
      query.schoolCode = Number(schoolCode);
    }
    
    if (studentClass && studentClass !== 'all') {
      query.class = studentClass;
    }
    
    if (section && section !== 'all') {
      query.section = section;
    }
    
    if (rollNo) {
      query.rollNo = { $regex: rollNo, $options: 'i' };
    }

    const resultKey = subject ? (examFieldMap[subject] || subject) : null;
    const isKG = isKGExam(subject);
    const StudentModel = isKG ? KINDERGARTEN_STUDENT : STUDENT_LATEST;

    if (isKG) {
      query.class = "KD";
    }

    if (resultKey) {
      query[`result.${resultKey}.total.score`] = { $exists: true };
    }

    // Build sort object
    let sortField = sortBy;
    if (resultKey && sortBy.startsWith('total.')) {
      sortField = `result.${resultKey}.${sortBy}`;
    } else if (resultKey && ['internationalRank', 'nationalRank', 'cityRank', 'schoolRank', 'classRank', 'sectionRank'].includes(sortBy)) {
      sortField = `result.${resultKey}.ranks.${sortBy}`;
    }
    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Fetch all matching results (no pagination for export)
    const students = await StudentModel.find(query).sort(sortObj).lean();

    // Get all school info for city/country lookups (handle both Number and String schoolCode)
    const rawSchoolCodes = [...new Set(students.map(s => s.schoolCode))];
    const schoolCodeNumbers = rawSchoolCodes.map(c => Number(c));
    const schoolCodeStrings = rawSchoolCodes.map(c => String(c));
    const schools = await School.find({ 
      schoolCode: { $in: [...schoolCodeNumbers, ...schoolCodeStrings] } 
    }).lean();
    const schoolMap = {};
    schools.forEach(s => { 
      schoolMap[Number(s.schoolCode)] = s; 
      schoolMap[String(s.schoolCode)] = s; 
    });

    // Helper function to calculate rank using database count
    const calculateGlobalRank = async (studentScore, additionalQuery = {}) => {
      if (studentScore <= 0) return 0;
      const higherCount = await StudentModel.countDocuments({
        ...additionalQuery,
        [`result.${resultKey}.attendance`]: "PRESENT",
        [`result.${resultKey}.total.score`]: { $gt: studentScore }
      });
      return higherCount + 1;
    };

    // Transform for Excel export with rank calculations
    const excelData = await Promise.all(students.map(async (student) => {
      const resultData = resultKey ? student.result?.[resultKey] : null;
      const studentScore = resultData?.total?.score ?? 0;
      const schoolInfo = schoolMap[student.schoolCode] || {};
      const studentCity = schoolInfo.city || student.city || '';
      const studentCountry = schoolInfo.country || 'INDIA';

      // Get school codes for city and country for rank calculation
      let citySchoolCodes = [];
      let countrySchoolCodes = [];

      if (studentCity) {
        const citySchools = await School.find({ city: studentCity }).distinct('schoolCode');
        citySchoolCodes = citySchools;
      }

      if (studentCountry) {
        const countrySchools = await School.find({ country: studentCountry }).distinct('schoolCode');
        countrySchoolCodes = countrySchools;
      }

      // Calculate all ranks in parallel
      let intlRank = 0, nationalRank = 0, cityRank = 0, schRank = 0, clsRank = 0, secRank = 0;

      if (resultData?.attendance === "PRESENT" && studentScore > 0) {
        [intlRank, nationalRank, cityRank, schRank, clsRank, secRank] = await Promise.all([
          calculateGlobalRank(studentScore, {}),
          countrySchoolCodes.length > 0
            ? calculateGlobalRank(studentScore, { schoolCode: { $in: countrySchoolCodes } })
            : Promise.resolve(0),
          citySchoolCodes.length > 0
            ? calculateGlobalRank(studentScore, { schoolCode: { $in: citySchoolCodes } })
            : Promise.resolve(0),
          calculateGlobalRank(studentScore, { schoolCode: student.schoolCode }),
          calculateGlobalRank(studentScore, { schoolCode: student.schoolCode, class: student.class }),
          calculateGlobalRank(studentScore, { schoolCode: student.schoolCode, class: student.class, section: student.section })
        ]);
      }

      return {
        "fatherName": student["Father's Name"] || student.fatherName || '',
        "city name": studentCity,
        "country name": studentCountry,
        "subject": subject || '',
        "exam date": resultData?.examDate || '',
        "SRORE": studentScore,
        "INTERNATION RANK": intlRank,
        "national rank": nationalRank,
        "city rank": cityRank,
        "school rank": schRank,
        "class rank": clsRank,
        "SECTION RANK": secRank,
        "prize": resultData?.prize || ''
      };
    }));

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Results");

    // Set column widths
    const colWidths = [
      { wch: 25 }, // fatherName
      { wch: 15 }, // city name
      { wch: 15 }, // country name
      { wch: 12 }, // subject
      { wch: 12 }, // exam date
      { wch: 10 }, // SRORE
      { wch: 20 }, // INTERNATION RANK
      { wch: 15 }, // national rank
      { wch: 12 }, // city rank
      { wch: 12 }, // school rank
      { wch: 12 }, // class rank
      { wch: 15 }, // SECTION RANK
      { wch: 10 }, // prize
    ];
    worksheet['!cols'] = colWidths;

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="results_export_${Date.now()}.xlsx"`);
    
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting results:", error);
    res.status(500).json({ error: "Failed to export results" });
  }
};