import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";
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

    const { subject, studentClass, schoolCode, examLevel } = req.body;

    if (!subject || !studentClass || !schoolCode) {
      // Cleanup uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Subject, class, and school code are required" });
    }

    // Map exam code to internal field name (e.g., IQMOL1 -> IMOL1)
    const resultKey = examFieldMap[subject] || subject;

    console.log(`📊 Processing ${data.length} result records for ${resultKey}`);

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

        // Parse section-wise data
        const section1 = {
          score: Number(row["S1_Score"]) || 0,
          percentage: Number(row["S1_Percentage"]) || 0,
          correctCount: Number(row["S1_CorrectQCount"]) || 0,
          totalCount: Number(row["S1_TotalQCount"]) || 0,
          unAttempted: Number(row["S1_UnAttempted"]) || 0,
        };

        const section2 = {
          score: Number(row["S2_Score"]) || 0,
          percentage: Number(row["S2_Percentage"]) || 0,
          correctCount: Number(row["S2_CorrectQCount"]) || 0,
          totalCount: Number(row["S2_TotalQCount"]) || 0,
          unAttempted: Number(row["S2_UnAttempted"]) || 0,
        };

        const section3 = {
          score: Number(row["S3_Score"]) || 0,
          percentage: Number(row["S3_Percentage"]) || 0,
          correctCount: Number(row["S3_CorrectQCount"]) || 0,
          totalCount: Number(row["S3_TotalQCount"]) || 0,
          unAttempted: Number(row["S3_UnAttempted"]) || 0,
        };

        const section4 = {
          score: Number(row["S4_Score"]) || 0,
          percentage: Number(row["S4_Percentage"]) || 0,
          correctCount: Number(row["S4_CorrectQCount"]) || 0,
          totalCount: Number(row["S4_TotalQCount"]) || 0,
          unAttempted: Number(row["S4_UnAttempted"]) || 0,
        };

        const section5 = {
          score: Number(row["S5_Score"]) || 0,
          percentage: Number(row["S5_Percentage"]) || 0,
          correctCount: Number(row["S5_CorrectQCount"]) || 0,
          totalCount: Number(row["S5_TotalQCount"]) || 0,
          unAttempted: Number(row["S5_UnAttempted"]) || 0,
        };

        const total = {
          score: Number(row["Total_Score"]) || 0,
          rank: Number(row["Total_Rank"]) || 0,
          percentage: Number(row["Total_Percentage"]) || 0,
          correctCount: Number(row["Total_CorrectQCount"]) || 0,
          totalCount: Number(row["Total_TotalQCount"]) || 0,
          unAttempted: Number(row["Total_UnAttempted"]) || 0,
        };

        // Determine pass/fail based on attendance and total score
        let passOrFail = "FAIL";
        if (attendance === "PRESENT" && total.percentage >= 40) {
          passOrFail = "PASS";
        } else if (attendance === "ABSENT" || attendance === "DISQUALIFIED") {
          passOrFail = attendance;
        }

        // Update student record
        const updateResult = await STUDENT_LATEST.findOneAndUpdate(
          {
            rollNo: rollNo,
            class: studentClass,
            schoolCode: Number(schoolCode),
          },
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

    const { subject, studentClass, schoolCode } = req.body;
    const resultKey = examFieldMap[subject] || subject;

    let successCount = 0;

    for (const row of data) {
      const rollNo = row["roll no"];
      const marksObtained = Number(row["marks obtained"]);
      const totalMarks = Number(row["total marks"]);
      const passOrFail = row["pass or fail"];

      if (!rollNo || isNaN(marksObtained) || isNaN(totalMarks)) continue;

      await STUDENT_LATEST.findOneAndUpdate(
        {
          rollNo: rollNo,
          class: studentClass,
          schoolCode: Number(schoolCode),
        },
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
      successCount++;
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
    const student = await STUDENT_LATEST.findOne(
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

    // Check if exam config exists for this subject - REQUIRED before viewing results
    const { ResultConfig } = await import("../models/resultConfigModel.js");
    const examConfig = await ResultConfig.findOne({ 
      subject, 
      classLevel: "all",
      batchId: "2024-25"
    });

    // BLOCK results if no exam config exists
    if (!examConfig) {
      return res.status(403).json({ 
        success: false,
        error: "Exam configuration required",
        message: `No exam configuration found for ${subject}. Please configure the exam topics in Exam Management before viewing results.`,
        hasExamConfig: false
      });
    }

    // Build query
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

    // Show all students with results (PRESENT, ABSENT, DISQUALIFIED)
    // Just check that attendance field exists
    query[`result.${resultKey}.attendance`] = { $exists: true };

    // Get list of student IDs/mobNos that have admit cards generated
    // We need to filter results to only show students with admit cards
    const mongoose = await import("mongoose");
    const db = mongoose.default.connection.db;
    const admitCardsCollection = db.collection("admitCards.files");
    
    // Get all mobile numbers from admit cards
    const admitCards = await admitCardsCollection.find({}).project({ "metadata.mobNo": 1 }).toArray();
    const admitCardMobNos = admitCards.map(ac => ac.metadata?.mobNo).filter(Boolean);
    
    // Filter to only students who have admit cards
    if (admitCardMobNos.length > 0) {
      query.mobNo = { $in: admitCardMobNos };
    } else {
      // No admit cards exist at all - return empty results
      return res.status(200).json({
        success: true,
        data: [],
        hasExamConfig: true,
        examConfig: {
          topicNames: examConfig.topicNames,
          isPublished: examConfig.isPublished
        },
        pagination: {
          currentPage: Number(page),
          totalPages: 0,
          totalCount: 0,
          limit: Number(limit)
        }
      });
    }

    // Build the projection
    const projection = {
      rollNo: 1,
      "Student's Name": 1,
      "Father's Name": 1,
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
    const totalCount = await STUDENT_LATEST.countDocuments(query);

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
    const students = await STUDENT_LATEST.find(query, projection)
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
      const higherCount = await STUDENT_LATEST.countDocuments({
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

    if (resultKey) {
      query[`result.${resultKey}.attendance`] = { $exists: true };
    }

    // Fetch all matching results (no pagination for export)
    const students = await STUDENT_LATEST.find(query).lean();

    // Transform for Excel export
    const excelData = students.map(student => {
      const resultData = resultKey ? student.result?.[resultKey] : null;
      
      return {
        "Father's Name": student["Father's Name"] || '',
        "City Name": student.city || '',
        "Country": student.country || 'INDIA',
        "Subject": subject || '',
        "Exam Date": resultData?.examDate || '',
        "SCORE": resultData?.total?.score ?? 0,
        "INTERNATIONAL RANK": resultData?.ranks?.internationalRank ?? 0,
        "National Rank": resultData?.ranks?.nationalRank ?? 0,
        "City Rank": resultData?.ranks?.cityRank ?? 0,
        "School Rank": resultData?.ranks?.schoolRank ?? 0,
        "Class Rank": resultData?.ranks?.classRank ?? 0,
        "SECTION RANK": resultData?.ranks?.sectionRank ?? 0,
        "Prize": resultData?.prize || ''
      };
    });

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Results");

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Father's Name
      { wch: 15 }, // City Name
      { wch: 10 }, // Country
      { wch: 12 }, // Subject
      { wch: 12 }, // Exam Date
      { wch: 8 },  // SCORE
      { wch: 18 }, // INTERNATIONAL RANK
      { wch: 14 }, // National Rank
      { wch: 10 }, // City Rank
      { wch: 12 }, // School Rank
      { wch: 10 }, // Class Rank
      { wch: 12 }, // SECTION RANK
      { wch: 10 }, // Prize
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