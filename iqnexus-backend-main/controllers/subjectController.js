import { Subject } from "../models/subjectModel.js";

/**
 * Default subjects based on existing hardcoded exam options.
 * Used to seed the database if no subjects exist.
 */
const defaultSubjects = [
  { code: "IQMOL1", name: "Mathematics Olympiad Level 1", label: "IQMO L1", category: "Mathematics", examLevel: "L1", resultFieldKey: "IMOL1", registrationField: "IMOL1", displayOrder: 1, linkedLevel1Subject: "" },
  { code: "IQMOL2", name: "Mathematics Olympiad Level 2", label: "IQMO L2", category: "Mathematics", examLevel: "L2", resultFieldKey: "IMOL2", registrationField: "IMOL2", displayOrder: 2, linkedLevel1Subject: "IQMOL1" },
  { code: "IQROL1", name: "Reasoning Olympiad Level 1", label: "IQRO L1", category: "Reasoning", examLevel: "L1", resultFieldKey: "IAOL1", registrationField: "IAOL1", displayOrder: 3, linkedLevel1Subject: "" },
  { code: "IQROL2", name: "Reasoning Olympiad Level 2", label: "IQRO L2", category: "Reasoning", examLevel: "L2", resultFieldKey: "IAOL2", registrationField: "IAOL2", displayOrder: 4, linkedLevel1Subject: "IQROL1" },
  { code: "IQSOL1", name: "Science Olympiad Level 1", label: "IQSO L1", category: "Science", examLevel: "L1", resultFieldKey: "ITSTL1", registrationField: "ITSTL1", displayOrder: 5, linkedLevel1Subject: "" },
  { code: "IQSOL2", name: "Science Olympiad Level 2", label: "IQSO L2", category: "Science", examLevel: "L2", resultFieldKey: "ITSTL2", registrationField: "ITSTL2", displayOrder: 6, linkedLevel1Subject: "IQSOL1" },
  { code: "IQEOL1", name: "English Olympiad Level 1", label: "IQEO L1", category: "English", examLevel: "L1", resultFieldKey: "IENGOL1", registrationField: "IENGOL1", displayOrder: 7, linkedLevel1Subject: "" },
  { code: "IQEOL2", name: "English Olympiad Level 2", label: "IQEO L2", category: "English", examLevel: "L2", resultFieldKey: "IENGOL2", registrationField: "IENGOL2", displayOrder: 8, linkedLevel1Subject: "IQEOL1" },
  { code: "IQGKOL1", name: "GK Olympiad Level 1", label: "IQGKO L1", category: "General Knowledge", examLevel: "L1", resultFieldKey: "IGKOL1", registrationField: "IGKOL1", displayOrder: 9, linkedLevel1Subject: "" },
  { code: "IQGKOL2", name: "GK Olympiad Level 2", label: "IQGKO L2", category: "General Knowledge", examLevel: "L2", resultFieldKey: "IGKOL2", registrationField: "IGKOL2", displayOrder: 10, linkedLevel1Subject: "IQGKOL1" },
  { code: "IQKD1", name: "Kindergarten Exam 1", label: "IQKD1", category: "Kindergarten", examLevel: "L1", resultFieldKey: "IQKD1", registrationField: "IQKD1", displayOrder: 11, linkedLevel1Subject: "" },
  { code: "IQKD2", name: "Kindergarten Exam 2", label: "IQKD2", category: "Kindergarten", examLevel: "L2", resultFieldKey: "IQKD2", registrationField: "IQKD2", displayOrder: 12, linkedLevel1Subject: "IQKD1" },
];


/**
 * Get all subjects (with optional filters)
 */
export const getAllSubjects = async (req, res) => {
  try {
    const { batchId, examLevel, category, activeOnly = "true" } = req.query;
    const filter = {};
    
    if (batchId) filter.batchId = batchId;
    if (examLevel) filter.examLevel = examLevel;
    if (category) filter.category = category;
    if (activeOnly === "true") filter.isActive = true;

    const subjects = await Subject.find(filter).sort({ displayOrder: 1, code: 1 });

    // If no subjects exist, seed defaults
    if (subjects.length === 0 && !batchId && !examLevel && !category) {
      await Subject.insertMany(defaultSubjects);
      const seeded = await Subject.find({}).sort({ displayOrder: 1 });
      return res.status(200).json({ success: true, subjects: seeded, seeded: true });
    }

    res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subjects" });
  }
};


/**
 * Get a single subject by code
 */
export const getSubject = async (req, res) => {
  try {
    const { code } = req.params;
    const subject = await Subject.findOne({ code: code.toUpperCase() });
    
    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    res.status(200).json({ success: true, subject });
  } catch (error) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subject" });
  }
};


/**
 * Create a new subject
 */
export const createSubject = async (req, res) => {
  try {
    const {
      code, name, label, category, examLevel,
      resultFieldKey, registrationField,
      paperStructure, qualificationRules, tieBreakOrder,
      achieversSectionIndex, higherDifficultyIndex,
      linkedLevel1Subject, batchId, displayOrder,
    } = req.body;

    if (!code || !name || !label || !category || !examLevel) {
      return res.status(400).json({ 
        success: false, 
        error: "code, name, label, category, and examLevel are required" 
      });
    }

    // Check for duplicate
    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: "Subject code already exists" });
    }

    const subject = new Subject({
      code: code.toUpperCase(),
      name,
      label,
      category,
      examLevel,
      resultFieldKey: resultFieldKey || code.toUpperCase(),
      registrationField: registrationField || "",
      paperStructure: paperStructure || undefined,
      qualificationRules: qualificationRules || undefined,
      tieBreakOrder: tieBreakOrder || undefined,
      achieversSectionIndex: achieversSectionIndex || 5,
      higherDifficultyIndex: higherDifficultyIndex || 4,
      linkedLevel1Subject: linkedLevel1Subject || "",
      batchId: batchId || "2024-25",
      displayOrder: displayOrder || 0,
    });

    await subject.save();

    res.status(201).json({ success: true, subject });
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ success: false, error: "Failed to create subject" });
  }
};


/**
 * Update a subject
 */
export const updateSubject = async (req, res) => {
  try {
    const { code } = req.params;
    const updateData = req.body;

    // Don't allow changing the code
    delete updateData.code;

    const subject = await Subject.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: updateData },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    res.status(200).json({ success: true, subject });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ success: false, error: "Failed to update subject" });
  }
};


/**
 * Delete a subject (soft delete - set isActive to false)
 */
export const deleteSubject = async (req, res) => {
  try {
    const { code } = req.params;
    
    const subject = await Subject.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    res.status(200).json({ success: true, message: "Subject deactivated successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ success: false, error: "Failed to delete subject" });
  }
};


/**
 * Hard delete a subject (permanent)
 */
export const permanentDeleteSubject = async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await Subject.findOneAndDelete({ code: code.toUpperCase() });

    if (!result) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    res.status(200).json({ success: true, message: "Subject permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting subject:", error);
    res.status(500).json({ success: false, error: "Failed to permanently delete subject" });
  }
};


/**
 * Update tie-break order for a subject
 */
export const updateTieBreakOrder = async (req, res) => {
  try {
    const { code } = req.params;
    const { tieBreakOrder, achieversSectionIndex, higherDifficultyIndex } = req.body;

    const validCriteria = ["totalMarks", "achieversSection", "higherDifficulty", "level1Marks", "age"];
    
    if (tieBreakOrder) {
      const invalid = tieBreakOrder.filter(c => !validCriteria.includes(c));
      if (invalid.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid tie-break criteria: ${invalid.join(", ")}. Valid options: ${validCriteria.join(", ")}` 
        });
      }
    }

    const updateData = {};
    if (tieBreakOrder) updateData.tieBreakOrder = tieBreakOrder;
    if (achieversSectionIndex !== undefined) updateData.achieversSectionIndex = achieversSectionIndex;
    if (higherDifficultyIndex !== undefined) updateData.higherDifficultyIndex = higherDifficultyIndex;

    const subject = await Subject.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: updateData },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    res.status(200).json({ success: true, subject });
  } catch (error) {
    console.error("Error updating tie-break order:", error);
    res.status(500).json({ success: false, error: "Failed to update tie-break order" });
  }
};


/**
 * Update qualification rules for a subject
 */
export const updateQualificationRules = async (req, res) => {
  try {
    const { code } = req.params;
    const { qualifyingPercentage, qualifiesForLevel2, minimumAttendance } = req.body;

    const updateData = {};
    if (qualifyingPercentage !== undefined) {
      updateData["qualificationRules.qualifyingPercentage"] = qualifyingPercentage;
    }
    if (qualifiesForLevel2 !== undefined) {
      updateData["qualificationRules.qualifiesForLevel2"] = qualifiesForLevel2;
    }
    if (minimumAttendance !== undefined) {
      updateData["qualificationRules.minimumAttendance"] = minimumAttendance;
    }

    const subject = await Subject.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: updateData },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    res.status(200).json({ success: true, subject });
  } catch (error) {
    console.error("Error updating qualification rules:", error);
    res.status(500).json({ success: false, error: "Failed to update qualification rules" });
  }
};


/**
 * Get exam field map dynamically from database
 * Returns { "IQMOL1": "IMOL1", "IQROL1": "IAOL1", ... }
 */
export const getExamFieldMap = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).lean();
    const fieldMap = {};
    
    for (const s of subjects) {
      fieldMap[s.code] = s.resultFieldKey;
    }

    res.status(200).json({ success: true, fieldMap });
  } catch (error) {
    console.error("Error getting exam field map:", error);
    res.status(500).json({ success: false, error: "Failed to get exam field map" });
  }
};


/**
 * Seed default subjects if none exist
 */
export const seedSubjects = async (req, res) => {
  try {
    const count = await Subject.countDocuments();
    if (count > 0) {
      return res.status(200).json({ success: true, message: "Subjects already exist", count });
    }

    await Subject.insertMany(defaultSubjects);
    const subjects = await Subject.find({}).sort({ displayOrder: 1 });

    res.status(201).json({ success: true, subjects, message: "Default subjects seeded" });
  } catch (error) {
    console.error("Error seeding subjects:", error);
    res.status(500).json({ success: false, error: "Failed to seed subjects" });
  }
};
