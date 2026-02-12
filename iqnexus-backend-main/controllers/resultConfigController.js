import { ResultConfig } from "../models/resultConfigModel.js";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";

// Exam code mapping
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

// Get rating based on percentage
const getRating = (percentage, ratingScale) => {
  if (percentage >= ratingScale.excellent.min) return ratingScale.excellent;
  if (percentage >= ratingScale.good.min) return ratingScale.good;
  if (percentage >= ratingScale.average.min) return ratingScale.average;
  if (percentage >= ratingScale.improve.min) return ratingScale.improve;
  return ratingScale.bad;
};

/**
 * Get result configuration (does NOT auto-create)
 */
export const getResultConfig = async (req, res) => {
  try {
    const { subject, classLevel, batchId = "2024-25" } = req.query;
    
    if (!subject) {
      return res.status(400).json({ error: "Subject is required" });
    }

    // Try exact classLevel first, then fall back to any config for this subject
    let config = await ResultConfig.findOne({ 
      subject, 
      classLevel: classLevel || "all",
      batchId 
    });
    if (!config) {
      config = await ResultConfig.findOne({ 
        subject,
        batchId 
      });
    }

    // Return null if config doesn't exist - DO NOT auto-create
    if (!config) {
      return res.status(200).json({ 
        success: true, 
        config: null,
        message: "No configuration found. Please create one in Exam Management first."
      });
    }

    res.status(200).json({ success: true, config });
  } catch (error) {
    console.error("Error getting result config:", error);
    res.status(500).json({ error: "Failed to get result configuration" });
  }
};

/**
 * Update result configuration
 */
export const updateResultConfig = async (req, res) => {
  try {
    const { subject, classLevel, batchId = "2024-25" } = req.body;
    const updateData = req.body;

    console.log("💾 Saving config for subject:", subject);
    console.log("💾 topicNames being saved:", updateData.topicNames);

    if (!subject) {
      return res.status(400).json({ error: "Subject is required" });
    }

    const config = await ResultConfig.findOneAndUpdate(
      { subject, classLevel: classLevel || "all", batchId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log("💾 Config saved, topicNames in DB:", config.topicNames);

    res.status(200).json({ success: true, config });
  } catch (error) {
    console.error("Error updating result config:", error);
    res.status(500).json({ error: "Failed to update result configuration" });
  }
};

/**
 * Publish results for a subject/class
 */
export const publishResults = async (req, res) => {
  try {
    const { subject, classLevel, batchId = "2024-25", publish = true } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required" });
    }

    const config = await ResultConfig.findOneAndUpdate(
      { subject, classLevel: classLevel || "all", batchId },
      { 
        $set: { 
          isPublished: publish,
          publishedAt: publish ? new Date() : null,
          publishedBy: req.body.adminId || "admin"
        } 
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ 
      success: true, 
      message: publish ? "Results published successfully" : "Results unpublished",
      config 
    });
  } catch (error) {
    console.error("Error publishing results:", error);
    res.status(500).json({ error: "Failed to publish results" });
  }
};

/**
 * Calculate rank for a student within a group
 * @param {Number} studentScore - The student's score
 * @param {Object} matchQuery - MongoDB match query for the group
 * @param {String} resultKey - The result field key (e.g., 'IAOL1')
 * @returns {Number} - The rank (1-based)
 */
const calculateRank = async (studentScore, matchQuery, resultKey) => {
  try {
    // Count students with higher scores (present students only)
    const higherCount = await STUDENT_LATEST.countDocuments({
      ...matchQuery,
      [`result.${resultKey}.attendance`]: "PRESENT",
      [`result.${resultKey}.total.score`]: { $gt: studentScore }
    });
    return higherCount + 1; // Rank is 1 + number of students with higher scores
  } catch (error) {
    console.error("Error calculating rank:", error);
    return 0;
  }
};

/**
 * Get single student result with full details
 */
export const getSingleStudentResult = async (req, res) => {
  try {
    const { rollNo, subject, classLevel } = req.query;

    if (!rollNo || !subject) {
      return res.status(400).json({ error: "Roll number and subject are required" });
    }

    const resultKey = examFieldMap[subject] || subject;

    // Find student
    const student = await STUDENT_LATEST.findOne({ rollNo }).lean();
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get school info
    const school = await School.findOne({ schoolCode: student.schoolCode }).lean();

    // Get result config - first try universal 'all' config, then class-specific
    let config = await ResultConfig.findOne({ 
      subject, 
      classLevel: "all",
      batchId: "2024-25"
    });

    // If no universal config, try class-specific
    if (!config) {
      config = await ResultConfig.findOne({ 
        subject, 
        classLevel: classLevel || student.class,
        batchId: "2024-25"
      });
    }

    // Create default config if not exists
    if (!config) {
      config = {
        topicNames: {
          section1: "Section 1",
          section2: "Section 2",
          section3: "Section 3",
          section4: "Section 4",
          section5: "Section 5",
        },
        rankVisibility: {
          schoolRank: true,
          zonalRank: true,
          nationalRank: true,
          internationalRank: true,
          classRank: true,
          sectionRank: true,
        },
        displaySettings: {
          showPercentileScore: true,
          showQualificationStatus: true,
          showTopicPerformance: true,
          showAIChart: true,
        },
        ratingScale: {
          excellent: { min: 80, max: 100, color: "#22c55e", label: "EXCELLENT" },
          good: { min: 70, max: 79, color: "#3b82f6", label: "GOOD" },
          average: { min: 60, max: 69, color: "#eab308", label: "AVERAGE" },
          improve: { min: 45, max: 59, color: "#f97316", label: "IMPROVE" },
          bad: { min: 0, max: 44, color: "#ef4444", label: "BAD" },
        },
        isPublished: false
      };
    }

    const resultData = student.result?.[resultKey];

    if (!resultData) {
      return res.status(404).json({ error: "Result not found for this subject" });
    }

    // Get student's score for rank calculation
    const studentScore = resultData.total?.score ?? 0;
    const studentCity = student.city || school?.city || "";
    const studentCountry = school?.country || "INDIA";

    // Calculate ranks dynamically (only for present students)
    let ranks = {
      internationalRank: 0,
      nationalRank: 0,
      cityRank: 0,
      schoolRank: 0,
      classRank: 0,
      sectionRank: 0
    };

    if (resultData.attendance === "PRESENT" && studentScore > 0) {
      // Get all school codes for the same city (for city rank)
      const citySchools = studentCity ? 
        await School.find({ city: studentCity }).distinct('schoolCode') : [];
      
      // Get all school codes for the same country (for national rank)
      const countrySchools = studentCountry ? 
        await School.find({ country: studentCountry }).distinct('schoolCode') : [];

      // Calculate all ranks in parallel for better performance
      const [intlRank, nationalRank, cityRank, schoolRank, classRank, sectionRank] = await Promise.all([
        // International Rank - All students globally
        calculateRank(studentScore, {}, resultKey),
        
        // National Rank - Students in the same country
        countrySchools.length > 0 
          ? calculateRank(studentScore, { schoolCode: { $in: countrySchools } }, resultKey)
          : Promise.resolve(0),
        
        // City/Zonal Rank - Students in the same city
        citySchools.length > 0 
          ? calculateRank(studentScore, { schoolCode: { $in: citySchools } }, resultKey)
          : Promise.resolve(0),
        
        // School Rank - Students in the same school
        calculateRank(studentScore, { schoolCode: student.schoolCode }, resultKey),
        
        // Class Rank - Students in the same school and class
        calculateRank(studentScore, { 
          schoolCode: student.schoolCode, 
          class: student.class 
        }, resultKey),
        
        // Section Rank - Students in the same school, class, and section
        calculateRank(studentScore, { 
          schoolCode: student.schoolCode, 
          class: student.class,
          section: student.section 
        }, resultKey)
      ]);

      ranks = {
        internationalRank: intlRank,
        nationalRank: nationalRank,
        cityRank: cityRank,
        schoolRank: schoolRank,
        classRank: classRank,
        sectionRank: sectionRank
      };
    }

    // Build topic-wise performance
    const topicPerformance = [];
    
    // Ensure we have proper topicNames - handle both Mongoose document and plain object
    const topicNamesObj = config.topicNames?.toObject ? config.topicNames.toObject() : config.topicNames;
    console.log("📝 Config topicNames:", JSON.stringify(topicNamesObj, null, 2));
    
    for (let i = 1; i <= 5; i++) {
      const section = resultData[`section${i}`];
      if (section) {
        const percentage = section.percentage || 
          (section.correctCount && section.totalCount 
            ? Math.round((section.correctCount / section.totalCount) * 100) 
            : 0);
        const rating = getRating(percentage, config.ratingScale);
        const wrong = (section.totalCount || 0) - (section.correctCount || 0) - (section.unAttempted || 0);
        
        const topicName = topicNamesObj?.[`section${i}`] || `Section ${i}`;
        console.log(`📝 Section ${i} topic name:`, topicName);
        
        topicPerformance.push({
          sectionNumber: i,
          topicName: topicName,
          totalQuestions: section.totalCount || 0,
          correct: section.correctCount || 0,
          wrong: wrong > 0 ? wrong : 0,
          notAttempted: section.unAttempted || 0,
          marks: section.score || 0,
          totalMarks: section.totalCount || 0,
          percentage,
          rating: rating.label,
          ratingColor: rating.color,
        });
      }
    }

    // Calculate overall rating
    const overallPercentage = resultData.total?.percentage || 0;
    const overallRating = getRating(overallPercentage, config.ratingScale);

    // Build response in format expected by frontend
    const response = {
      student: {
        studentName: student["Student's Name"] || student.studentName,
        rollNo: student.rollNo,
        studentClass: student.class,
        section: student.section,
        schoolName: school?.schoolName || student.school || "N/A",
        schoolCode: student.schoolCode,
        fatherName: student["Father's Name"] || student.fatherName,
        city: studentCity || "N/A",
        country: studentCountry,
      },
      
      result: {
        subject: subject,
        examDate: resultData.examDate || "",
        attendance: resultData.attendance || "PRESENT",
        totalScore: resultData.total?.score ?? 0,
        totalMarks: resultData.total?.totalCount ?? 0,
        // Calculate total max score from percentage: maxScore = score / (percentage/100)
        // Fall back to 100 if percentage is 0 or missing
        totalMaxScore: (resultData.total?.percentage > 0 && resultData.total?.score != null)
          ? Math.round(resultData.total.score / (resultData.total.percentage / 100))
          : 100,
        percentage: resultData.total?.percentage ?? 0,
        percentile: resultData.percentileScore || resultData.total?.percentile || 0,
        qualifiedForLevel2: resultData.passOrFail?.toUpperCase() === "PASS",
        passOrFail: resultData.passOrFail || "N/A",
        // Calculated Ranks
        schoolRank: ranks.schoolRank,
        classRank: ranks.classRank,
        sectionRank: ranks.sectionRank,
        cityRank: ranks.cityRank,
        nationalRank: ranks.nationalRank,
        internationalRank: ranks.internationalRank,
      },
      
      topicPerformance,
      overallRating: overallRating.label,
      rankVisibility: config.rankVisibility,
      isPublished: config.isPublished,
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error getting single student result:", error);
    res.status(500).json({ error: "Failed to get student result", details: error.message });
  }
};

/**
 * Get published result for student portal
 */
export const getPublishedResult = async (req, res) => {
  try {
    const { rollNo, subject } = req.query;

    if (!rollNo || !subject) {
      return res.status(400).json({ 
        success: false, 
        error: "Roll number and subject are required" 
      });
    }

    // Check if results are published - first check universal config, then any matching config
    let config = await ResultConfig.findOne({ 
      subject, 
      classLevel: "all",
      batchId: "2024-25"
    });

    // If no universal config found, try finding any published config for this subject
    if (!config) {
      config = await ResultConfig.findOne({
        subject,
        batchId: "2024-25",
        isPublished: true
      });
    }

    if (!config?.isPublished) {
      return res.status(200).json({ 
        success: false, 
        message: "Results not published yet",
        isPublished: false 
      });
    }

    // Use the same logic as getSingleStudentResult
    return getSingleStudentResult(req, res);
  } catch (error) {
    console.error("Error getting published result:", error);
    res.status(500).json({ success: false, error: "Failed to get result" });
  }
};

/**
 * Get all configurations for admin
 */
export const getAllConfigs = async (req, res) => {
  try {
    const configs = await ResultConfig.find({}).sort({ subject: 1, classLevel: 1 });
    res.status(200).json({ success: true, configs });
  } catch (error) {
    console.error("Error getting all configs:", error);
    res.status(500).json({ error: "Failed to get configurations" });
  }
};
/**
 * Delete a result configuration
 */
export const deleteResultConfig = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25" } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required" });
    }

    const result = await ResultConfig.findOneAndDelete({
      subject,
      classLevel,
      batchId
    });

    if (!result) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    console.log(`🗑️ Deleted config for subject: ${subject}`);

    res.status(200).json({ 
      success: true, 
      message: "Configuration deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting result config:", error);
    res.status(500).json({ error: "Failed to delete configuration" });
  }
};