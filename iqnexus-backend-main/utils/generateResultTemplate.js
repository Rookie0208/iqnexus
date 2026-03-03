import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate Result Template for Classes 1-12
 * This creates an XLSX template matching the required upload format
 */
export function generateResultTemplate() {
  // Define the headers matching the expected upload format
  const headers = [
    'ROLL NO',
    'ATTENDANCE',
    'CLASS',
    'SECTION',
    // Section 1
    'S1_Score',
    'S1_Percentage',
    'S1_CorrectQCount',
    'S1_TotalQCount',
    'S1_UnAttempted',
    // Section 2
    'S2_Score',
    'S2_Percentage',
    'S2_CorrectQCount',
    'S2_TotalQCount',
    'S2_UnAttempted',
    // Section 3
    'S3_Score',
    'S3_Percentage',
    'S3_CorrectQCount',
    'S3_TotalQCount',
    'S3_UnAttempted',
    // Section 4
    'S4_Score',
    'S4_Percentage',
    'S4_CorrectQCount',
    'S4_TotalQCount',
    'S4_UnAttempted',
    // Section 5
    'S5_Score',
    'S5_Percentage',
    'S5_CorrectQCount',
    'S5_TotalQCount',
    'S5_UnAttempted',
    // Total Marks
    'Total_Score',
    'Total_Rank',
    'Total_Percentage',
    'Total_CorrectQCount',
    'Total_TotalQCount',
    'Total_UnAttempted',
  ];

  // Sample data rows to help users understand the format
  const sampleData = [
    {
      'ROLL NO': '18000302',
      'ATTENDANCE': 'PRESENT',
      'CLASS': '2',
      'SECTION': 'B',
      'S1_Score': 0,
      'S1_Percentage': 0,
      'S1_CorrectQCount': 0,
      'S1_TotalQCount': 10,
      'S1_UnAttempted': 0,
      'S2_Score': 25,
      'S2_Percentage': 6,
      'S2_CorrectQCount': 8,
      'S2_TotalQCount': 6,
      'S2_UnAttempted': 25,
      'S3_Score': 2,
      'S3_Percentage': 5,
      'S3_CorrectQCount': 0,
      'S3_TotalQCount': 6,
      'S3_UnAttempted': 50,
      'S4_Score': 2,
      'S4_Percentage': 4,
      'S4_CorrectQCount': 0,
      'S4_TotalQCount': 4,
      'S4_UnAttempted': 0,
      'S5_Score': 10,
      'S5_Percentage': 50,
      'S5_CorrectQCount': 2,
      'S5_TotalQCount': 4,
      'S5_UnAttempted': 0,
      'Total_Score': 24,
      'Total_Rank': 4,
      'Total_Percentage': 18.46,
      'Total_CorrectQCount': 54,
      'Total_TotalQCount': 7,
      'Total_UnAttempted': 28,
    },
    {
      'ROLL NO': '18000102',
      'ATTENDANCE': 'PRESENT',
      'CLASS': '2',
      'SECTION': 'A',
      'S1_Score': 15,
      'S1_Percentage': 30,
      'S1_CorrectQCount': 3,
      'S1_TotalQCount': 7,
      'S1_UnAttempted': 10,
      'S2_Score': 0,
      'S2_Percentage': 6,
      'S2_CorrectQCount': 37.5,
      'S2_TotalQCount': 3,
      'S2_UnAttempted': 4,
      'S3_Score': 7,
      'S3_Percentage': 1,
      'S3_CorrectQCount': 6,
      'S3_TotalQCount': 25,
      'S3_UnAttempted': 2,
      'S4_Score': 6,
      'S4_Percentage': 8,
      'S4_CorrectQCount': 0,
      'S4_TotalQCount': 0,
      'S4_UnAttempted': 4,
      'S5_Score': 4,
      'S5_Percentage': 1,
      'S5_CorrectQCount': 5,
      'S5_TotalQCount': 25,
      'S5_UnAttempted': 1,
      'Total_Score': 29,
      'Total_Rank': 3,
      'Total_Percentage': 22.30,
      'Total_CorrectQCount': 78,
      'Total_TotalQCount': 9,
      'Total_UnAttempted': 24,
    },
    {
      'ROLL NO': '18000702',
      'ATTENDANCE': 'ABSENT',
      'CLASS': '2',
      'SECTION': 'B',
      'S1_Score': 0,
      'S1_Percentage': 0,
      'S1_CorrectQCount': 0,
      'S1_TotalQCount': 0,
      'S1_UnAttempted': 0,
      'S2_Score': 0,
      'S2_Percentage': 0,
      'S2_CorrectQCount': 0,
      'S2_TotalQCount': 0,
      'S2_UnAttempted': 0,
      'S3_Score': 0,
      'S3_Percentage': 0,
      'S3_CorrectQCount': 0,
      'S3_TotalQCount': 0,
      'S3_UnAttempted': 0,
      'S4_Score': 0,
      'S4_Percentage': 0,
      'S4_CorrectQCount': 0,
      'S4_TotalQCount': 0,
      'S4_UnAttempted': 0,
      'S5_Score': 0,
      'S5_Percentage': 0,
      'S5_CorrectQCount': 0,
      'S5_TotalQCount': 0,
      'S5_UnAttempted': 0,
      'Total_Score': 0,
      'Total_Rank': 0,
      'Total_Percentage': 0,
      'Total_CorrectQCount': 0,
      'Total_TotalQCount': 0,
      'Total_UnAttempted': 0,
    },
    {
      'ROLL NO': '18000802',
      'ATTENDANCE': 'DISQUALIFIED',
      'CLASS': '2',
      'SECTION': 'A',
      'S1_Score': 0,
      'S1_Percentage': 0,
      'S1_CorrectQCount': 0,
      'S1_TotalQCount': 0,
      'S1_UnAttempted': 0,
      'S2_Score': 0,
      'S2_Percentage': 0,
      'S2_CorrectQCount': 0,
      'S2_TotalQCount': 0,
      'S2_UnAttempted': 0,
      'S3_Score': 0,
      'S3_Percentage': 0,
      'S3_CorrectQCount': 0,
      'S3_TotalQCount': 0,
      'S3_UnAttempted': 0,
      'S4_Score': 0,
      'S4_Percentage': 0,
      'S4_CorrectQCount': 0,
      'S4_TotalQCount': 0,
      'S4_UnAttempted': 0,
      'S5_Score': 0,
      'S5_Percentage': 0,
      'S5_CorrectQCount': 0,
      'S5_TotalQCount': 0,
      'S5_UnAttempted': 0,
      'Total_Score': 0,
      'Total_Rank': 0,
      'Total_Percentage': 0,
      'Total_CorrectQCount': 0,
      'Total_TotalQCount': 0,
      'Total_UnAttempted': 0,
    },
  ];

  // Create workbook
  const workbook = xlsx.utils.book_new();

  // Create worksheet with sample data
  const worksheet = xlsx.utils.json_to_sheet(sampleData, { header: headers });

  // Set column widths
  worksheet['!cols'] = headers.map((header) => ({
    wch: Math.max(header.length + 2, 12),
  }));

  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Result Template');

  // Create Instructions sheet
  const instructionsData = [
    { Instructions: 'RESULT UPLOAD TEMPLATE - CLASSES 1-12' },
    { Instructions: '' },
    { Instructions: 'COLUMN DESCRIPTIONS:' },
    { Instructions: '─────────────────────────────────────' },
    { Instructions: 'ROLL NO - Student Roll Number (Required)' },
    { Instructions: 'ATTENDANCE - PRESENT / ABSENT / DISQUALIFIED (Required)' },
    { Instructions: 'CLASS - Student Class (1-12) - For reference only' },
    { Instructions: 'SECTION - Student Section (A, B, C, etc.) - For reference only' },
    { Instructions: '' },
    { Instructions: 'SECTION COLUMNS (S1-S5):' },
    { Instructions: 'S{n}_Score - Score obtained in section' },
    { Instructions: 'S{n}_Percentage - Percentage in section' },
    { Instructions: 'S{n}_CorrectQCount - Number of correct answers' },
    { Instructions: 'S{n}_TotalQCount - Total questions in section' },
    { Instructions: 'S{n}_UnAttempted - Number of unattempted questions' },
    { Instructions: '' },
    { Instructions: 'TOTAL COLUMNS:' },
    { Instructions: 'Total_Score - Total score obtained' },
    { Instructions: 'Total_Rank - Student rank' },
    { Instructions: 'Total_Percentage - Overall percentage' },
    { Instructions: 'Total_CorrectQCount - Total correct answers' },
    { Instructions: 'Total_TotalQCount - Total questions' },
    { Instructions: 'Total_UnAttempted - Total unattempted' },
    { Instructions: '' },
    { Instructions: 'NOTES:' },
    { Instructions: '• Delete the sample rows before uploading' },
    { Instructions: '• Keep only student data with valid roll numbers' },
    { Instructions: '• For ABSENT/DISQUALIFIED students, set all scores to 0' },
    { Instructions: '• Select Exam Level and Subject in the upload form. Class and School Code are optional — students are matched by Roll Number.' },
  ];

  const instructionSheet = xlsx.utils.json_to_sheet(instructionsData);
  instructionSheet['!cols'] = [{ wch: 60 }];
  xlsx.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

  return workbook;
}

// Run this script directly to generate the template file
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const workbook = generateResultTemplate();
  const outputPath = path.join(__dirname, '..', 'assets', 'resultTemplate.xlsx');
  
  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  xlsx.writeFile(workbook, outputPath);
  console.log(`✅ Template generated at: ${outputPath}`);
}

export default generateResultTemplate;
