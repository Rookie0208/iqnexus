import express from "express";
import {
  getAllSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  permanentDeleteSubject,
  updateTieBreakOrder,
  updateQualificationRules,
  getExamFieldMap,
  seedSubjects,
} from "../controllers/subjectController.js";

const router = express.Router();

// GET /subjects - List all subjects (with optional filters)
router.get("/subjects", getAllSubjects);

// GET /subjects/field-map - Get exam field map for dynamic lookups
router.get("/subjects/field-map", getExamFieldMap);

// POST /subjects/seed - Seed default subjects
router.post("/subjects/seed", seedSubjects);

// GET /subjects/:code - Get single subject by code
router.get("/subjects/:code", getSubject);

// POST /subjects - Create a new subject
router.post("/subjects", createSubject);

// PUT /subjects/:code - Update a subject
router.put("/subjects/:code", updateSubject);

// PUT /subjects/:code/tie-break - Update tie-break order
router.put("/subjects/:code/tie-break", updateTieBreakOrder);

// PUT /subjects/:code/qualification - Update qualification rules
router.put("/subjects/:code/qualification", updateQualificationRules);

// DELETE /subjects/:code - Soft delete (deactivate)
router.delete("/subjects/:code", deleteSubject);

// DELETE /subjects/:code/permanent - Hard delete
router.delete("/subjects/:code/permanent", permanentDeleteSubject);

export default router;
