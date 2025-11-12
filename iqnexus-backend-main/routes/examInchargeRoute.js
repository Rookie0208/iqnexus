import express from 'express';
import { createExamIncharge } from '../controllers/ExamInchargeController.js';
const router = express.Router();


router.post('/createExamIncharge',createExamIncharge );


export default router;