import express from "express";
import {
  getAttendanceStudents,
  getStudentByMobile,
  getAllStudents,
  getStudents,
  getStudentsWithoutPagination,
  getDashboardAnalytics,
  updateStudent,
  addStudent
} from "../controllers/studentController.js";
import { storeFeedBack } from "../controllers/feedbackController.js";
import { getFeedback } from "../controllers/feedbackController.js";
import { uploadStudentBulk } from "../controllers/uploadStudentController.js";

const router = express.Router();
router.post('/upload-studentData' ,uploadStudentBulk)
router.get("/get-student", getStudentByMobile);
router.get("/all-students", getAllStudents);
router.post("/allStudents", getAttendanceStudents)

// also using for fetching participation 
router.post("/students", getStudents);

router.post("/all-students-no-pagination", getStudentsWithoutPagination);
router.put("/student", updateStudent);
router.post("/add-student", addStudent);
router.get("/dashboard-analytics", getDashboardAnalytics);
router.post("/feedback", storeFeedBack);
router.get("/feedbacks", getFeedback);
export default router;
