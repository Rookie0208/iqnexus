import express from "express";
import multer from "multer";
import {
  getKindergartenStudents,
  getAllKindergartenStudents,
  getAllKindergartenStudentsNoPagination,
  deleteKindergartenStudent,
  updateKindergartenStudent,
  addKindergartenStudent,
  uploadKindergartenStudentsCSV,
  getKindergartenAttendance
} from "../controllers/kindergartenController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/kindergarten-students", getKindergartenStudents);
router.get("/all-kindergarten-students", getAllKindergartenStudents);
router.post("/all-kindergarten-students-no-pagination", getAllKindergartenStudentsNoPagination);
router.delete("/kindergarten-student", deleteKindergartenStudent);
router.put("/kindergarten-student", updateKindergartenStudent);
router.post("/add-kindergarten-student", addKindergartenStudent);
router.post("/upload-kindergarten-students", upload.single("file"), uploadKindergartenStudentsCSV);
router.post("/kindergarten-attendance", getKindergartenAttendance);

export default router;
