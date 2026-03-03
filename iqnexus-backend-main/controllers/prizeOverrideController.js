import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { PrizeConfig } from "../models/prizeConfigModel.js";
import { Subject } from "../models/subjectModel.js";
import { School } from "../models/schoolModel.js";

const isKGExam = (subject) => ["IQKD1", "IQKD2"].includes(subject);
const getStudentModel = (subject) =>
  isKGExam(subject) ? KINDERGARTEN_STUDENT : STUDENT_LATEST;

/**
 * Get exam field map dynamically
 */
const getExamFieldMapFromDB = async () => {
  const subjects = await Subject.find({ isActive: true }).lean();
  if (subjects.length > 0) {
    const map = {};
    for (const s of subjects) map[s.code] = s.resultFieldKey;
    return map;
  }
  return {
    IQEOL1: "IENGOL1", IQEOL2: "IENGOL2",
    IQROL1: "IAOL1", IQROL2: "IAOL2",
    IQSOL1: "ITSTL1", IQSOL2: "ITSTL2",
    IQMOL1: "IMOL1", IQMOL2: "IMOL2",
    IQGKOL1: "IGKOL1", IQGKOL2: "IGKOL2",
    IQKD1: "IQKD1", IQKD2: "IQKD2",
  };
};


/**
 * POST /prize-override/assign
 * Manually assign prize to a specific student
 */
export const assignPrizeToStudent = async (req, res) => {
  try {
    const { 
      rollNo, subject, prize, 
      adminId = "admin", reason = "" 
    } = req.body;

    if (!rollNo || !subject || !prize) {
      return res.status(400).json({ 
        success: false, 
        error: "rollNo, subject, and prize are required" 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    const updated = await StudentModel.findOneAndUpdate(
      { rollNo },
      {
        $set: {
          [`result.${resultKey}.prize`]: prize,
          [`result.${resultKey}.prizeManual`]: true,
          [`result.${resultKey}.prizeOverride`]: {
            by: adminId,
            at: new Date(),
            reason,
            type: "manual-assign",
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: `Prize '${prize}' assigned to ${rollNo}`,
      student: {
        rollNo: updated.rollNo,
        studentName: updated.studentName,
        prize,
      },
    });
  } catch (error) {
    console.error("Error assigning prize:", error);
    res.status(500).json({ success: false, error: "Failed to assign prize" });
  }
};


/**
 * POST /prize-override/remove
 * Remove a prize from a specific student
 */
export const removePrizeFromStudent = async (req, res) => {
  try {
    const { rollNo, subject, adminId = "admin", reason = "" } = req.body;

    if (!rollNo || !subject) {
      return res.status(400).json({ 
        success: false, 
        error: "rollNo and subject are required" 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    const updated = await StudentModel.findOneAndUpdate(
      { rollNo },
      {
        $set: {
          [`result.${resultKey}.prize`]: "",
          [`result.${resultKey}.prizeManual`]: false,
          [`result.${resultKey}.prizeOverride`]: {
            by: adminId,
            at: new Date(),
            reason,
            type: "manual-remove",
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: `Prize removed from ${rollNo}`,
    });
  } catch (error) {
    console.error("Error removing prize:", error);
    res.status(500).json({ success: false, error: "Failed to remove prize" });
  }
};


/**
 * POST /prize-override/change-winner
 * Change prize from one student to another
 */
export const changePrizeWinner = async (req, res) => {
  try {
    const { 
      fromRollNo, toRollNo, subject, prize,
      adminId = "admin", reason = "" 
    } = req.body;

    if (!fromRollNo || !toRollNo || !subject || !prize) {
      return res.status(400).json({ 
        success: false, 
        error: "fromRollNo, toRollNo, subject, and prize are required" 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    // Remove from original winner
    await StudentModel.findOneAndUpdate(
      { rollNo: fromRollNo },
      {
        $set: {
          [`result.${resultKey}.prize`]: "",
          [`result.${resultKey}.prizeManual`]: false,
          [`result.${resultKey}.prizeOverride`]: {
            by: adminId,
            at: new Date(),
            reason: reason || `Prize transferred to ${toRollNo}`,
            type: "change-winner-remove",
          },
        },
      }
    );

    // Assign to new winner
    const newWinner = await StudentModel.findOneAndUpdate(
      { rollNo: toRollNo },
      {
        $set: {
          [`result.${resultKey}.prize`]: prize,
          [`result.${resultKey}.prizeManual`]: true,
          [`result.${resultKey}.prizeOverride`]: {
            by: adminId,
            at: new Date(),
            reason: reason || `Prize transferred from ${fromRollNo}`,
            type: "change-winner-assign",
          },
        },
      },
      { new: true }
    );

    if (!newWinner) {
      return res.status(404).json({ success: false, error: "New winner student not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: `Prize '${prize}' transferred from ${fromRollNo} to ${toRollNo}`,
    });
  } catch (error) {
    console.error("Error changing prize winner:", error);
    res.status(500).json({ success: false, error: "Failed to change prize winner" });
  }
};


/**
 * POST /prize-override/special-award
 * Assign special award to student (independent of rank)
 */
export const assignSpecialAward = async (req, res) => {
  try {
    const { 
      rollNo, subject, award,
      adminId = "admin", reason = "" 
    } = req.body;

    if (!rollNo || !subject || !award) {
      return res.status(400).json({ 
        success: false, 
        error: "rollNo, subject, and award are required" 
      });
    }

    const examFieldMap = await getExamFieldMapFromDB();
    const resultKey = examFieldMap[subject] || subject;
    const StudentModel = getStudentModel(subject);

    const updated = await StudentModel.findOneAndUpdate(
      { rollNo },
      {
        $push: {
          [`result.${resultKey}.specialAwards`]: {
            award,
            awardedBy: adminId,
            awardedAt: new Date(),
            reason,
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: `Special award '${award}' assigned to ${rollNo}`,
    });
  } catch (error) {
    console.error("Error assigning special award:", error);
    res.status(500).json({ success: false, error: "Failed to assign special award" });
  }
};


/**
 * POST /prize-override/edit-allocation
 * Edit prize allocation for an entire prize rule (e.g., change how many prizes per category)
 */
export const editPrizeAllocation = async (req, res) => {
  try {
    const { 
      configId, ruleId, 
      totalPrizes, prizeType, category,
      adminId = "admin"
    } = req.body;

    if (!configId || !ruleId) {
      return res.status(400).json({ 
        success: false, 
        error: "configId and ruleId are required" 
      });
    }

    const config = await PrizeConfig.findById(configId);
    if (!config) {
      return res.status(404).json({ success: false, error: "Prize config not found" });
    }

    // Find and update the specific rule
    const rule = config.prizeRules.id(ruleId);
    if (!rule) {
      return res.status(404).json({ success: false, error: "Prize rule not found" });
    }

    if (totalPrizes !== undefined) rule.totalPrizes = totalPrizes;
    if (prizeType) rule.prizeType = prizeType;
    if (category) rule.category = category;

    await config.save();

    res.status(200).json({ 
      success: true, 
      message: "Prize allocation updated",
      config,
    });
  } catch (error) {
    console.error("Error editing prize allocation:", error);
    res.status(500).json({ success: false, error: "Failed to edit prize allocation" });
  }
};
