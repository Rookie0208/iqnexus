import express from "express";
import resultRoutes from "./resultRoutes.js";
import studentRoutes from "./studentRoutes.js";
import kindergartenRoutes from "./kindergartenRoutes.js";
import admitCardRoutes from "./admitCardRoutes.js";
import certificateRoutes from "./certificateRoutes.js";
import schoolRoutes from "./schoolRoutes.js";
import studyroutes from "./studentStudyMaterialRoute.js"
import answerRoutes from "./answerRoutes.js";
import participationRoutes from "./participationListRoutes.js";
import feedbackRoutes from "./feedBackRoute.js";
import ExamInchargeRoutes from "./examInchargeRoute.js";
import updateAdvanceEntryList from "./AdvanceEntryRoute.js";
const router = express.Router();

router.use("/", studentRoutes);
router.use("/", kindergartenRoutes);
router.use("/", admitCardRoutes);
router.use("/", certificateRoutes);
router.use("/", schoolRoutes);
// router.use("/", adminRoutes);
router.use("/", studyroutes);
router.use("/", answerRoutes);
router.use("/", participationRoutes);
router.use("/",resultRoutes);
router.use("/", feedbackRoutes);
router.use("/", ExamInchargeRoutes);
router.use("/", updateAdvanceEntryList);
export default router;
