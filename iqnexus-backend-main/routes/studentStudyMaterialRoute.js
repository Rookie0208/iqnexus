import { Router } from "express";
import multer from "multer";
import { addStudentStudyMaterial, fetchStudyMaterialForAdmin, deleteStudyMaterial } from "../controllers/studentStudyMaterialController.js";
import { fetchStudyMaterial } from "../services/studyMaterialService.js";
const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/addStudentStudyMaterial", upload.single("file"), addStudentStudyMaterial);
router.post("/fetchStudyMaterial", fetchStudyMaterial);
router.get('/fetchAdminStudyMaterial',fetchStudyMaterialForAdmin )
router.delete('/deleteStudyMaterial/:id', deleteStudyMaterial)

export default router;