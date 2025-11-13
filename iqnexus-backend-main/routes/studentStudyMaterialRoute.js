import { Router } from "express";
import { addStudentStudyMaterial, fetchStudyMaterialForAdmin, deleteStudyMaterial } from "../controllers/studentStudyMaterialController.js";
import express from "express";
import { fetchStudyMaterial } from "../services/studyMaterialService.js";
const router = Router();

router.post("/addStudentStudyMaterial", addStudentStudyMaterial);
router.post("/fetchStudyMaterial", fetchStudyMaterial);
router.get('/fetchAdminStudyMaterial',fetchStudyMaterialForAdmin )
router.delete('/deleteStudyMaterial/:id', deleteStudyMaterial)

export default router;