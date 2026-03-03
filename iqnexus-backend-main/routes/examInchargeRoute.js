import express from 'express';
import multer from 'multer';
import { createExamIncharge } from '../controllers/ExamInchargeController.js';
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/createExamIncharge', upload.single('file'), createExamIncharge);


export default router;