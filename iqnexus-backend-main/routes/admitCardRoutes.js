import express from "express";
import {
  getAdmitCardStudents,
  generateAdmitCards,
  fetchAdmitCardByPhone,
  fetchAdmitCardForStudent,
  getGeneratedAdmitCards,
  downloadAdmitCardById,
} from "../controllers/admitCardController.js";

const router = express.Router();

router.post("/admit-card-students", getAdmitCardStudents);
router.post("/admit-card", generateAdmitCards);
router.get("/student-admit-card/:phone", fetchAdmitCardByPhone);
router.post("/fetch-admit-card", fetchAdmitCardForStudent);
router.post("/generated-admit-cards", getGeneratedAdmitCards);
router.get("/download-admit-card/:fileId", downloadAdmitCardById);

export default router;
