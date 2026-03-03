import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";
import { ResultConfig } from "../models/resultConfigModel.js";
import { Subject } from "../models/subjectModel.js";

/**
 * Get exam field map dynamically from the Subject collection.
 * Falls back to hardcoded map if DB is empty.
 */
const getExamFieldMapFromDB = async () => {
  const subjects = await Subject.find({ isActive: true }).lean();
  if (subjects.length > 0) {
    const map = {};
    for (const s of subjects) {
      map[s.code] = s.resultFieldKey;
    }
    return map;
  }
  // Fallback to hardcoded
  return {
    IQEOL1: "IENGOL1", IQEOL2: "IENGOL2",
    IQROL1: "IAOL1", IQROL2: "IAOL2",
    IQSOL1: "ITSTL1", IQSOL2: "ITSTL2",
    IQMOL1: "IMOL1", IQMOL2: "IMOL2",
    IQGKOL1: "IGKOL1", IQGKOL2: "IGKOL2",
    IQKD1: "IQKD1", IQKD2: "IQKD2",
  };
};

const isKGExam = (subject) => ["IQKD1", "IQKD2"].includes(subject);
const getStudentModel = (subject) =>
  isKGExam(subject) ? KINDERGARTEN_STUDENT : STUDENT_LATEST;


// ═══════════════════════════════════════════════════════════
// 1. QUALIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════

/**
 * GET /qualification-settings
 * Get qualifying percentage for a subject
 */
export const getQualificationSettings = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25" } = req.query;

    if (!subject) {
      return res.status(400).json({ success: false, error: "Subject is required" });
    }

    // Try ResultConfig first
    let config = await ResultConfig.findOne({ subject, classLevel, batchId });
    if (!config) config = await ResultConfig.findOne({ subject, batchId });

    // Also get subject-level settings
    const subjectDoc = await Subject.findOne({ code: subject }).lean();

    const qualifyingPercentage = config?.qualifyingPercentage ??
      subjectDoc?.qualificationRules?.qualifyingPercentage ?? 40;

    res.status(200).json({
      success: true,
      qualifyingPercentage,
      source: config?.qualifyingPercentage != null ? "resultConfig" : "subjectDefault",
    });
  } catch (error) {
    console.error("Error getting qualification settings:", error);
    res.status(500).json({ success: false, error: "Failed to get qualification settings" });
  }
};

/**
 * POST /qualification-settings
 * Update qualifying percentage for a subject
 */
export const updateQualificationSettings = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25", qualifyingPercentage } = req.body;

    if (!subject || qualifyingPercentage == null) {
      return res.status(400).json({ success: false, error: "Subject and qualifyingPercentage are required" });
    }

    if (qualifyingPercentage < 0 || qualifyingPercentage > 100) {
      return res.status(400).json({ success: false, error: "Percentage must be between 0 and 100" });
    }

    // Update ResultConfig
    const config = await ResultConfig.findOneAndUpdate(
      { subject, classLevel, batchId },
      { $set: { qualifyingPercentage } },
      { new: true, upsert: true }
    );

    // Also update the subject-level defaults
    await Subject.findOneAndUpdate(
      { code: subject },
      { $set: { "qualificationRules.qualifyingPercentage": qualifyingPercentage } }
    );

    res.status(200).json({ success: true, config, qualifyingPercentage });
  } catch (error) {
    console.error("Error updating qualification settings:", error);
    res.status(500).json({ success: false, error: "Failed to update qualification settings" });
  }
};

/**
 * POST /recalculate-qualification
 * Recalculate pass/fail for all students based on current qualifying percentage
 */
export const recalculateQualification = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25" } = req.body;

    if (!subject) {
      return res.status(400).json({ success: false, error: "Subject is required" });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    // Get qualification threshold
    let config = await ResultConfig.findOne({ subject, classLevel, batchId });
    if (!config) config = await ResultConfig.findOne({ subject, batchId });
    
    const subjectDoc = await Subject.findOne({ code: subject }).lean();
    const qualifyingPercentage = config?.qualifyingPercentage ??
      subjectDoc?.qualificationRules?.qualifyingPercentage ?? 40;

    // Find all students with results for this exam
    const query = {
      [`result.${resultKey}.total.score`]: { $exists: true },
    };
    if (classLevel && classLevel !== "all") {
      query.class = classLevel;
    }

    const students = await StudentModel.find(query).lean();

    let updatedCount = 0;
    let qualifiedCount = 0;
    let notQualifiedCount = 0;

    for (const student of students) {
      const resultData = student.result?.[resultKey];
      if (!resultData) continue;

      const attendance = resultData.attendance || "ABSENT";
      const percentage = resultData.total?.percentage || 0;

      let passOrFail = "FAIL";
      if (attendance === "PRESENT" && percentage >= qualifyingPercentage) {
        passOrFail = "PASS";
        qualifiedCount++;
      } else if (attendance === "ABSENT" || attendance === "DISQUALIFIED") {
        passOrFail = attendance;
      } else {
        notQualifiedCount++;
      }

      await StudentModel.updateOne(
        { _id: student._id },
        { $set: { [`result.${resultKey}.passOrFail`]: passOrFail } }
      );
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: "Qualification recalculated",
      qualifyingPercentage,
      summary: {
        totalProcessed: updatedCount,
        qualified: qualifiedCount,
        notQualified: notQualifiedCount,
      },
    });
  } catch (error) {
    console.error("Error recalculating qualification:", error);
    res.status(500).json({ success: false, error: "Failed to recalculate qualification" });
  }
};


// ═══════════════════════════════════════════════════════════
// 2. RANKING ENGINE WITH TIE-BREAKING
// ═══════════════════════════════════════════════════════════

/**
 * Compare two students using configurable tie-break criteria.
 * Returns <0 if a ranks higher, >0 if b ranks higher, 0 if tied.
 */
const compareStudents = (a, b, tieBreakOrder, resultKey, subjectConfig) => {
  for (const criterion of tieBreakOrder) {
    let diff = 0;

    switch (criterion) {
      case "totalMarks": {
        const scoreA = a.result?.[resultKey]?.total?.score ?? 0;
        const scoreB = b.result?.[resultKey]?.total?.score ?? 0;
        diff = scoreB - scoreA; // Higher is better
        break;
      }
      case "achieversSection": {
        const secIdx = subjectConfig?.achieversSectionIndex || 5;
        const secKey = `section${secIdx}`;
        const achieverA = a.result?.[resultKey]?.[secKey]?.score ?? 0;
        const achieverB = b.result?.[resultKey]?.[secKey]?.score ?? 0;
        diff = achieverB - achieverA;
        break;
      }
      case "higherDifficulty": {
        const diffIdx = subjectConfig?.higherDifficultyIndex || 4;
        const diffKey = `section${diffIdx}`;
        const diffA = a.result?.[resultKey]?.[diffKey]?.score ?? 0;
        const diffB = b.result?.[resultKey]?.[diffKey]?.score ?? 0;
        diff = diffB - diffA;
        break;
      }
      case "level1Marks": {
        // Only relevant for L2 exams - compare L1 scores
        const l1Subject = subjectConfig?.linkedLevel1Subject;
        if (l1Subject) {
          const l1Key = subjectConfig?.linkedLevel1ResultKey || l1Subject;
          const l1A = a.result?.[l1Key]?.total?.score ?? 0;
          const l1B = b.result?.[l1Key]?.total?.score ?? 0;
          diff = l1B - l1A;
        }
        break;
      }
      case "age": {
        // Younger preferred (higher DOB date = younger)
        const dobA = a.dob ? new Date(a.dob) : new Date(0);
        const dobB = b.dob ? new Date(b.dob) : new Date(0);
        diff = dobB.getTime() - dobA.getTime(); // Later DOB = younger = preferred
        break;
      }
    }

    if (diff !== 0) return diff;
  }

  return 0; // Completely tied
};

/**
 * POST /calculate-ranks
 * Calculate and store ranks for all students for a given subject + scope.
 * Supports multi-level tie-breaking.
 */
export const calculateRanks = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25", scope = "all" } = req.body;

    if (!subject) {
      return res.status(400).json({ success: false, error: "Subject is required" });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    // Get tie-break configuration from subject
    const subjectDoc = await Subject.findOne({ code: subject }).lean();
    const tieBreakOrder = subjectDoc?.tieBreakOrder || ["totalMarks", "achieversSection", "higherDifficulty", "level1Marks", "age"];
    
    // Resolve linked L1 result key
    let linkedLevel1ResultKey = "";
    if (subjectDoc?.linkedLevel1Subject) {
      linkedLevel1ResultKey = examFieldMap[subjectDoc.linkedLevel1Subject] || subjectDoc.linkedLevel1Subject;
    }
    const subjectConfig = {
      ...subjectDoc,
      linkedLevel1ResultKey,
    };

    // Build query for present students with results
    const query = {
      [`result.${resultKey}.attendance`]: "PRESENT",
      [`result.${resultKey}.total.score`]: { $exists: true },
    };
    if (classLevel && classLevel !== "all") {
      query.class = classLevel;
    }

    // Determine which fields we need for L1 comparison
    const projection = {
      rollNo: 1, class: 1, section: 1, schoolCode: 1, dob: 1, city: 1,
      [`result.${resultKey}`]: 1,
    };
    if (linkedLevel1ResultKey) {
      projection[`result.${linkedLevel1ResultKey}`] = 1;
    }

    const students = await StudentModel.find(query, projection).lean();

    if (students.length === 0) {
      return res.status(200).json({ success: true, message: "No students found for ranking", rankedCount: 0 });
    }

    // Get school info for each student
    const schoolCodes = [...new Set(students.map(s => s.schoolCode))];
    const schools = await School.find({ schoolCode: { $in: schoolCodes } }).lean();
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.schoolCode] = s; });

    // Enrich students with school info
    const enrichedStudents = students.map(s => ({
      ...s,
      city: schoolMap[s.schoolCode]?.city || s.city || "",
      country: schoolMap[s.schoolCode]?.country || "INDIA",
    }));

    // Sort using tie-break criteria
    enrichedStudents.sort((a, b) => compareStudents(a, b, tieBreakOrder, resultKey, subjectConfig));

    // Assign ranks (handle ties: students with same everything get same rank)
    const assignRanksToGroup = (group) => {
      let currentRank = 1;
      for (let i = 0; i < group.length; i++) {
        if (i > 0 && compareStudents(group[i], group[i - 1], tieBreakOrder, resultKey, subjectConfig) === 0) {
          // Tied with previous student, same rank
          group[i]._calculatedRank = group[i - 1]._calculatedRank;
        } else {
          group[i]._calculatedRank = currentRank;
        }
        currentRank++;
      }
      return group;
    };

    // International rank (all students)
    assignRanksToGroup(enrichedStudents);
    const intlRanks = {};
    enrichedStudents.forEach(s => { intlRanks[s.rollNo] = s._calculatedRank; });

    // National rank (grouped by country)
    const byCountry = {};
    enrichedStudents.forEach(s => {
      const k = s.country || "INDIA";
      if (!byCountry[k]) byCountry[k] = [];
      byCountry[k].push({ ...s });
    });
    const nationalRanks = {};
    for (const group of Object.values(byCountry)) {
      group.sort((a, b) => compareStudents(a, b, tieBreakOrder, resultKey, subjectConfig));
      assignRanksToGroup(group);
      group.forEach(s => { nationalRanks[s.rollNo] = s._calculatedRank; });
    }

    // City/Zonal rank
    const byCity = {};
    enrichedStudents.forEach(s => {
      const k = s.city || "UNKNOWN";
      if (!byCity[k]) byCity[k] = [];
      byCity[k].push({ ...s });
    });
    const cityRanks = {};
    for (const group of Object.values(byCity)) {
      group.sort((a, b) => compareStudents(a, b, tieBreakOrder, resultKey, subjectConfig));
      assignRanksToGroup(group);
      group.forEach(s => { cityRanks[s.rollNo] = s._calculatedRank; });
    }

    // School rank
    const bySchool = {};
    enrichedStudents.forEach(s => {
      const k = String(s.schoolCode);
      if (!bySchool[k]) bySchool[k] = [];
      bySchool[k].push({ ...s });
    });
    const schoolRanks = {};
    for (const group of Object.values(bySchool)) {
      group.sort((a, b) => compareStudents(a, b, tieBreakOrder, resultKey, subjectConfig));
      assignRanksToGroup(group);
      group.forEach(s => { schoolRanks[s.rollNo] = s._calculatedRank; });
    }

    // Class rank (school + class)
    const byClass = {};
    enrichedStudents.forEach(s => {
      const k = `${s.schoolCode}_${s.class}`;
      if (!byClass[k]) byClass[k] = [];
      byClass[k].push({ ...s });
    });
    const classRanks = {};
    for (const group of Object.values(byClass)) {
      group.sort((a, b) => compareStudents(a, b, tieBreakOrder, resultKey, subjectConfig));
      assignRanksToGroup(group);
      group.forEach(s => { classRanks[s.rollNo] = s._calculatedRank; });
    }

    // Section rank (school + class + section)
    const bySection = {};
    enrichedStudents.forEach(s => {
      const k = `${s.schoolCode}_${s.class}_${s.section}`;
      if (!bySection[k]) bySection[k] = [];
      bySection[k].push({ ...s });
    });
    const sectionRanks = {};
    for (const group of Object.values(bySection)) {
      group.sort((a, b) => compareStudents(a, b, tieBreakOrder, resultKey, subjectConfig));
      assignRanksToGroup(group);
      group.forEach(s => { sectionRanks[s.rollNo] = s._calculatedRank; });
    }

    // Store ranks in student documents
    let updatedCount = 0;
    for (const student of enrichedStudents) {
      await StudentModel.updateOne(
        { _id: student._id },
        {
          $set: {
            [`result.${resultKey}.ranks`]: {
              internationalRank: intlRanks[student.rollNo] || 0,
              nationalRank: nationalRanks[student.rollNo] || 0,
              cityRank: cityRanks[student.rollNo] || 0,
              schoolRank: schoolRanks[student.rollNo] || 0,
              classRank: classRanks[student.rollNo] || 0,
              sectionRank: sectionRanks[student.rollNo] || 0,
            },
          },
        }
      );
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: "Ranks calculated and stored",
      tieBreakOrder,
      rankedCount: updatedCount,
    });
  } catch (error) {
    console.error("Error calculating ranks:", error);
    res.status(500).json({ success: false, error: "Failed to calculate ranks" });
  }
};


// ═══════════════════════════════════════════════════════════
// 3. ADMIN OVERRIDE
// ═══════════════════════════════════════════════════════════

/**
 * POST /override/edit-marks
 * Admin edits a student's marks for a specific subject/section
 */
export const editStudentMarks = async (req, res) => {
  try {
    const { 
      rollNo, subject, 
      section1, section2, section3, section4, section5, total,
      attendance, passOrFail,
      adminId = "admin", reason = ""
    } = req.body;

    if (!rollNo || !subject) {
      return res.status(400).json({ success: false, error: "rollNo and subject are required" });
    }

    // Check if result is locked
    const config = await ResultConfig.findOne({ subject, batchId: "2024-25" });
    if (config?.isLocked) {
      return res.status(403).json({ 
        success: false, 
        error: "Results are locked. Only Super Admin can unlock for editing." 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    const student = await StudentModel.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    // Build update object
    const updateFields = {};
    
    if (section1) updateFields[`result.${resultKey}.section1`] = section1;
    if (section2) updateFields[`result.${resultKey}.section2`] = section2;
    if (section3) updateFields[`result.${resultKey}.section3`] = section3;
    if (section4) updateFields[`result.${resultKey}.section4`] = section4;
    if (section5) updateFields[`result.${resultKey}.section5`] = section5;
    if (total) updateFields[`result.${resultKey}.total`] = total;
    if (attendance) updateFields[`result.${resultKey}.attendance`] = attendance;
    if (passOrFail) updateFields[`result.${resultKey}.passOrFail`] = passOrFail;

    // Track the override in an audit trail
    updateFields[`result.${resultKey}.lastOverride`] = {
      by: adminId,
      at: new Date(),
      reason,
      type: "edit-marks",
    };

    const updated = await StudentModel.findOneAndUpdate(
      { rollNo },
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Marks updated successfully", student: updated });
  } catch (error) {
    console.error("Error editing marks:", error);
    res.status(500).json({ success: false, error: "Failed to edit marks" });
  }
};

/**
 * POST /override/set-rank
 * Admin manually assigns a rank to a student (overrides calculated rank)
 */
export const setManualRank = async (req, res) => {
  try {
    const { 
      rollNo, subject, rankType, rankValue,
      isJointRank = false,
      adminId = "admin", reason = ""
    } = req.body;

    if (!rollNo || !subject || !rankType || rankValue == null) {
      return res.status(400).json({ 
        success: false, 
        error: "rollNo, subject, rankType, and rankValue are required" 
      });
    }

    // Check if result is locked
    const config = await ResultConfig.findOne({ subject, batchId: "2024-25" });
    if (config?.isLocked) {
      return res.status(403).json({ 
        success: false, 
        error: "Results are locked. Only Super Admin can unlock for editing." 
      });
    }

    const validRankTypes = ["internationalRank", "nationalRank", "cityRank", "schoolRank", "classRank", "sectionRank"];
    if (!validRankTypes.includes(rankType)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid rankType. Valid options: ${validRankTypes.join(", ")}` 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    const updateFields = {
      [`result.${resultKey}.ranks.${rankType}`]: rankValue,
      [`result.${resultKey}.ranks.${rankType}_manual`]: true,
      [`result.${resultKey}.ranks.${rankType}_joint`]: isJointRank,
      [`result.${resultKey}.lastOverride`]: {
        by: adminId,
        at: new Date(),
        reason,
        type: "manual-rank",
      },
    };

    const updated = await StudentModel.findOneAndUpdate(
      { rollNo },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: `${rankType} set to ${rankValue}${isJointRank ? " (joint rank)" : ""}`,
      student: updated 
    });
  } catch (error) {
    console.error("Error setting manual rank:", error);
    res.status(500).json({ success: false, error: "Failed to set manual rank" });
  }
};

/**
 * POST /override/joint-rank
 * Assign the same rank to multiple students (joint rank)
 */
export const assignJointRank = async (req, res) => {
  try {
    const { 
      rollNumbers, subject, rankType, rankValue,
      adminId = "admin", reason = "" 
    } = req.body;

    if (!rollNumbers || !Array.isArray(rollNumbers) || rollNumbers.length < 2 || !subject || !rankType || rankValue == null) {
      return res.status(400).json({
        success: false,
        error: "rollNumbers (array of 2+), subject, rankType, and rankValue are required"
      });
    }

    // Check if result is locked
    const config = await ResultConfig.findOne({ subject, batchId: "2024-25" });
    if (config?.isLocked) {
      return res.status(403).json({ 
        success: false, 
        error: "Results are locked. Only Super Admin can unlock for editing." 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    const updateFields = {
      [`result.${resultKey}.ranks.${rankType}`]: rankValue,
      [`result.${resultKey}.ranks.${rankType}_manual`]: true,
      [`result.${resultKey}.ranks.${rankType}_joint`]: true,
      [`result.${resultKey}.lastOverride`]: {
        by: adminId,
        at: new Date(),
        reason: reason || `Joint rank ${rankValue} assigned to ${rollNumbers.length} students`,
        type: "joint-rank",
      },
    };

    const result = await StudentModel.updateMany(
      { rollNo: { $in: rollNumbers } },
      { $set: updateFields }
    );

    res.status(200).json({
      success: true,
      message: `Joint ${rankType} = ${rankValue} assigned to ${result.modifiedCount} students`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error assigning joint rank:", error);
    res.status(500).json({ success: false, error: "Failed to assign joint rank" });
  }
};


// ═══════════════════════════════════════════════════════════
// 4. RESULT WORKFLOW (Draft → Review → Approve → Lock & Publish)
// ═══════════════════════════════════════════════════════════

/**
 * POST /result-workflow/status
 * Change the result workflow status
 */
export const changeResultStatus = async (req, res) => {
  try {
    const { 
      subject, classLevel = "all", batchId = "2024-25",
      newStatus, adminId = "admin", adminRole = "admin", note = ""
    } = req.body;

    if (!subject || !newStatus) {
      return res.status(400).json({ success: false, error: "subject and newStatus are required" });
    }

    const validStatuses = ["draft", "review", "approved", "locked"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status. Valid options: ${validStatuses.join(", ")}` 
      });
    }

    let config = await ResultConfig.findOne({ subject, classLevel, batchId });
    if (!config) {
      config = await ResultConfig.findOne({ subject, batchId });
    }
    if (!config) {
      return res.status(404).json({ success: false, error: "Result configuration not found" });
    }

    const currentStatus = config.resultStatus || "draft";

    // Enforce workflow transitions
    const allowedTransitions = {
      draft: ["review"],
      review: ["draft", "approved"],
      approved: ["review", "locked"],
      locked: [], // Only super admin can change from locked
    };

    // Super admin can do anything
    if (adminRole !== "superadmin") {
      // Normal admin cannot approve or lock
      if (newStatus === "approved" || newStatus === "locked") {
        return res.status(403).json({ 
          success: false, 
          error: "Only Super Admin can approve or lock results" 
        });
      }

      // Check if transition is allowed
      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return res.status(400).json({ 
          success: false, 
          error: `Cannot transition from '${currentStatus}' to '${newStatus}'` 
        });
      }

      // Normal admin cannot edit locked results
      if (config.isLocked) {
        return res.status(403).json({ 
          success: false, 
          error: "Results are locked. Only Super Admin can unlock." 
        });
      }
    }

    // Build update
    const updateData = {
      resultStatus: newStatus,
    };

    if (newStatus === "locked") {
      updateData.isLocked = true;
      updateData.isPublished = true; // Auto-publish on lock
      updateData.lockedAt = new Date();
      updateData.lockedBy = adminId;
      updateData.publishedAt = new Date();
      updateData.publishedBy = adminId;
    } else if (newStatus === "approved") {
      updateData.approvedAt = new Date();
      updateData.approvedBy = adminId;
    } else if (newStatus === "draft") {
      // Going back to draft
      updateData.isPublished = false;
      updateData.isLocked = false;
    }

    // Add to status history
    const historyEntry = {
      status: newStatus,
      changedBy: adminId,
      changedByRole: adminRole,
      changedAt: new Date(),
      note,
    };

    const updated = await ResultConfig.findOneAndUpdate(
      { _id: config._id },
      { 
        $set: updateData,
        $push: { statusHistory: historyEntry },
      },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: `Result status changed to '${newStatus}'`,
      config: updated,
    });
  } catch (error) {
    console.error("Error changing result status:", error);
    res.status(500).json({ success: false, error: "Failed to change result status" });
  }
};

/**
 * POST /result-workflow/unlock
 * Super Admin unlocks a locked result for editing
 */
export const unlockResults = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25", adminId, adminRole, note = "" } = req.body;

    if (adminRole !== "superadmin") {
      return res.status(403).json({ 
        success: false, 
        error: "Only Super Admin can unlock results" 
      });
    }

    let config = await ResultConfig.findOne({ subject, classLevel, batchId });
    if (!config) config = await ResultConfig.findOne({ subject, batchId });
    if (!config) {
      return res.status(404).json({ success: false, error: "Result configuration not found" });
    }

    const historyEntry = {
      status: "unlocked",
      changedBy: adminId,
      changedByRole: adminRole,
      changedAt: new Date(),
      note: note || "Results unlocked by Super Admin for editing",
    };

    const updated = await ResultConfig.findOneAndUpdate(
      { _id: config._id },
      { 
        $set: { 
          isLocked: false, 
          isPublished: false, 
          resultStatus: "review",
        },
        $push: { statusHistory: historyEntry },
      },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "Results unlocked for editing",
      config: updated,
    });
  } catch (error) {
    console.error("Error unlocking results:", error);
    res.status(500).json({ success: false, error: "Failed to unlock results" });
  }
};

/**
 * GET /result-workflow/status
 * Get current workflow status for a result
 */
export const getResultWorkflowStatus = async (req, res) => {
  try {
    const { subject, classLevel = "all", batchId = "2024-25" } = req.query;

    if (!subject) {
      return res.status(400).json({ success: false, error: "Subject is required" });
    }

    let config = await ResultConfig.findOne({ subject, classLevel, batchId });
    if (!config) config = await ResultConfig.findOne({ subject, batchId });
    if (!config) {
      return res.status(200).json({ 
        success: true, 
        status: "not_configured",
        isLocked: false,
        isPublished: false,
        statusHistory: [],
      });
    }

    res.status(200).json({
      success: true,
      status: config.resultStatus || "draft",
      isLocked: config.isLocked || false,
      isPublished: config.isPublished || false,
      approvedAt: config.approvedAt,
      approvedBy: config.approvedBy,
      lockedAt: config.lockedAt,
      lockedBy: config.lockedBy,
      qualifyingPercentage: config.qualifyingPercentage || 40,
      statusHistory: config.statusHistory || [],
    });
  } catch (error) {
    console.error("Error getting workflow status:", error);
    res.status(500).json({ success: false, error: "Failed to get workflow status" });
  }
};
