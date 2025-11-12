import express from "express";
import { updateAdvanceEntryList } from "../controllers/AdvanceEntryController.js";


const router = express.Router();

router.post("/updateAdvanceList", updateAdvanceEntryList);

export default router;
