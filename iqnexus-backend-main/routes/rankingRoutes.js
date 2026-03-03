import express from "express";
import {
  getQualificationSettings,
  updateQualificationSettings,
  recalculateQualification,
  calculateRanks,
  editStudentMarks,
  setManualRank,
  assignJointRank,
  changeResultStatus,
  unlockResults,
  getResultWorkflowStatus,
} from "../controllers/rankingController.js";
import {
  assignPrizeToStudent,
  removePrizeFromStudent,
  changePrizeWinner,
  assignSpecialAward,
  editPrizeAllocation,
} from "../controllers/prizeOverrideController.js";

const router = express.Router();

// ═══ Qualification Settings ═══
router.get("/qualification-settings", getQualificationSettings);
router.post("/qualification-settings", updateQualificationSettings);
router.post("/recalculate-qualification", recalculateQualification);

// ═══ Ranking ═══
router.post("/calculate-ranks", calculateRanks);

// ═══ Admin Override ═══
router.post("/override/edit-marks", editStudentMarks);
router.post("/override/set-rank", setManualRank);
router.post("/override/joint-rank", assignJointRank);

// ═══ Result Workflow ═══
router.get("/result-workflow/status", getResultWorkflowStatus);
router.post("/result-workflow/status", changeResultStatus);
router.post("/result-workflow/unlock", unlockResults);

// ═══ Prize Override ═══
router.post("/prize-override/assign", assignPrizeToStudent);
router.post("/prize-override/remove", removePrizeFromStudent);
router.post("/prize-override/change-winner", changePrizeWinner);
router.post("/prize-override/special-award", assignSpecialAward);
router.post("/prize-override/edit-allocation", editPrizeAllocation);

export default router;
