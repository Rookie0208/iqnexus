import express from "express";
import {
  fetchCertificate,
  generateDocument
} from "../controllers/certificateController.js";

const router = express.Router();

router.get("/fetch-certificate/:mobNo", fetchCertificate);
router.post("/generate/:type", generateDocument);

export default router;
