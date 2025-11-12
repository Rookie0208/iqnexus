import express from "express";
import {
  getKindergartenStudents,
  getAllKindergartenStudents,
  getAllKindergartenStudentsNoPagination,
  deleteKindergartenStudent,
  updateKindergartenStudent,
  addKindergartenStudent,
  uploadKindergartenStudentsCSV
} from "../controllers/kindergartenController.js";

const router = express.Router();

router.post("/kindergarten-students", getKindergartenStudents);
router.get("/all-kindergarten-students", getAllKindergartenStudents);
router.post("/all-kindergarten-students-no-pagination", getAllKindergartenStudentsNoPagination);
router.delete("/kindergarten-student", deleteKindergartenStudent);
router.put("/kindergarten-student", updateKindergartenStudent);
router.post("/add-kindergarten-student", addKindergartenStudent);
router.post("/upload-kindergarten-students", uploadKindergartenStudentsCSV);

export default router;
