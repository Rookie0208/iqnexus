import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { uploadResult, uploadResultSimple, getResult, getAllResults, getSchoolsForFilter, exportResultsToExcel } from '../controllers/resultController.js';

const upload = multer({ dest: 'uploads/' });
import { 
  getResultConfig, 
  updateResultConfig, 
  publishResults, 
  getSingleStudentResult, 
  getPublishedResult,
  getAllConfigs,
  deleteResultConfig
} from '../controllers/resultConfigController.js';
import { fetchBLQList } from '../controllers/BLQListController.js';
import generateResultTemplate from '../utils/generateResultTemplate.js';

const router = express.Router();

// Detailed result upload with section-wise breakdown (new format)
router.post('/upload-result', upload.single('file'), uploadResult);
router.post('/uploadResult', upload.single('file'), uploadResult); // Backward compatible route

// Simple result upload (backward compatible - old format)
router.post('/upload-result-simple', upload.single('file'), uploadResultSimple);

// Download result template (Classes 1-12)
router.get('/download-result-template', (req, res) => {
  try {
    const workbook = generateResultTemplate();
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=Result_Upload_Template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// View results with filters (for admin panel)
router.get('/view-results', getAllResults);
router.get('/schools-filter', getSchoolsForFilter);
router.get('/export-results', exportResultsToExcel);

// Result Configuration APIs
router.get('/result-config', getResultConfig);
router.post('/result-config', updateResultConfig);
router.delete('/result-config', deleteResultConfig);
router.get('/result-configs', getAllConfigs);
router.post('/publish-results', publishResults);

// Single student result view
router.get('/single-result', getSingleStudentResult);
router.get('/published-result', getPublishedResult);

router.get('/getResult', getResult);
router.get('/fetchBLQList', fetchBLQList);

export default router;