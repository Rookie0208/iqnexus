import express from "express";
import { getFeedback, storeFeedBack } from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/storeFeedback", storeFeedBack);
router.get("/getFeedback", getFeedback);

export default router;
