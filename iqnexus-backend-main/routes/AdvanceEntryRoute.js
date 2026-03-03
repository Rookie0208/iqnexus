import express from "express";
import multer from "multer";
import { updateAdvanceEntryList } from "../controllers/AdvanceEntryController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/updateAdvanceList", upload.single("file"), updateAdvanceEntryList);

export default router;
