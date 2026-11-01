import express from "express";
import {
  fetchCertificate,
  generateDocument,
  generateCertificatesBulk,
} from "../controllers/certificateController.js";

const router = express.Router();

router.get("/fetch-certificate/:mobNo", fetchCertificate);
router.post("/generate/:type", generateDocument);
router.post("/generate-certificates-bulk", generateCertificatesBulk);

export default router;
