import express from "express";
import { getPrizeTag } from "../controllers/prizeTagController.js";

const router = express.Router();

// GET /prize-tag?exam=IQGKOL1&level=basic&schoolCode=180
router.get("/prize-tag", getPrizeTag);

export default router;
