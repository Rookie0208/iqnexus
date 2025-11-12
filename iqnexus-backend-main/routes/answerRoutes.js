import express from 'express';
import { uploadAnswers } from '../controllers/AnswerController.js';
import { getAnswers } from '../controllers/AnswerController.js';
const router = express.Router();

router.post('/uploadAnswers', uploadAnswers)
router.post('/getAnswers', getAnswers);

export default router;