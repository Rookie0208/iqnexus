import express from "express";
import {
  getAllSchools,
  getSchoolById,
  getAllSchoolAdmitCards,
  addSchool,
  updateSchool,
  deleteSchool,
  fetchSchoolsByExamLevel,
  uploadSchoolData
} from "../controllers/schoolController.js";

const router = express.Router();

router.get("/all-schools", getAllSchools);
router.get("/get-school/:id", getSchoolById);
router.get("/all-school-admit-card", getAllSchoolAdmitCards);
router.post("/add-school", addSchool);
router.put("/school", updateSchool);
router.delete("/school/:schoolCode", deleteSchool);
router.post("/all-schools", fetchSchoolsByExamLevel);
router.post("/upload-schooldata", uploadSchoolData);

export default router;
