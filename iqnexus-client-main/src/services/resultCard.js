import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Function to generate result card HTML with data
const generateResultCardHTML = (resultData, studentData) => {
  // Get the first result entry (excluding 'success' and 'studentName')
  const resultKey = Object.keys(resultData).find(key => key !== 'success' && key !== 'studentName');
  const result = resultData[resultKey];
  
  if (!result) return null;

  // Determine level based on last 2 characters of subject name
  const subjectName = resultKey || '';
  const lastTwoChars = subjectName.slice(-2).toUpperCase();
  const isBasicLevel = lastTwoChars === 'L1';
  const levelText = isBasicLevel ? 'BASIC LEVEL RESULT' : 'ADVANCED LEVEL RESULT';

  const percentage = Math.round((result.marksObtained / result.totalMarks) * 100);
  const isQualified = result.passOrFail === "pass";
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Result Card</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 20px;
            line-height: 1.4;
          }

          .card {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #000;
            padding: 0;
          }

          .header {
            text-align: center;
            padding: 20px;
            border-bottom: 2px solid #000;
          }

          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            display: block;
          }

          .header h1 {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
            color: #000;
          }

          .header h2 {
            font-size: 1.4rem;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            color: #000;
          }

          .content {
            padding: 30px 40px;
          }

          .form-section {
            margin-bottom: 30px;
          }

          .form-row {
            display: flex;
            margin-bottom: 15px;
            align-items: center;
          }

          .form-label {
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            min-width: 200px;
            color: #000;
          }

          .form-value {
            font-size: 14px;
            color: #000;
            margin-left: 20px;
            border-bottom: 1px solid #000;
            min-width: 200px;
            padding-bottom: 2px;
          }

          .student-name-row {
            margin-bottom: 25px;
          }

          .student-name-row .form-label {
            min-width: 200px;
          }

          .student-name-row .form-value {
            font-size: 14px;
            font-weight: bold;
            min-width: 200px;
          }

          .performance-section {
            margin-top: 40px;
            border-top: 2px solid #000;
            padding-top: 20px;
          }

          .performance-title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
            margin-bottom: 20px;
            color: #000;
          }

          .performance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }

          .performance-item {
            text-align: center;
            padding: 10px;
          }

          .performance-label {
            font-weight: bold;
            font-size: 14px;
            color: #000;
            margin-bottom: 5px;
          }

          .performance-value {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            border: 1px solid #000;
            padding: 8px;
            min-height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qualified-yes {
            background-color: transparent;
          }

          .qualified-no {
            background-color: transparent;
          }

          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .card {
              border: 2px solid #000;
              box-shadow: none;
            }
          }

          /* Corner marks for printing alignment */
          .corner-mark {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid #000;
          }

          .top-left { top: 10px; left: 10px; border-right: none; border-bottom: none; }
          .top-right { top: 10px; right: 10px; border-left: none; border-bottom: none; }
          .bottom-left { bottom: 10px; left: 10px; border-right: none; border-top: none; }
          .bottom-right { bottom: 10px; right: 10px; border-left: none; border-top: none; }
        </style>
      </head>
      <body>
        <!-- Corner marks for alignment -->
        <div class="corner-mark top-left"></div>
        <div class="corner-mark top-right"></div>
        <div class="corner-mark bottom-left"></div>
        <div class="corner-mark bottom-right"></div>

        <div class="card">
          <!-- Header -->
          <div class="header">
            <img src="/main_logo.png" alt="IQ Nexus Logo" class="logo" />
    
            <h2>${levelText}</h2>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Student Information -->
            <div class="form-section">
              <div class="form-row student-name-row">
                <span class="form-label">Student Name:</span>
                <span class="form-value">${resultData.studentName || 'MOHAN'}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Roll No:</span>
                <span class="form-value">${studentData['Roll No'] || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Class:</span>
                <span class="form-value">${studentData['Class'] || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Section:</span>
                <span class="form-value">${studentData['Section'] || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">School:</span>
                <span class="form-value">${studentData['School'] || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Mark Scored:</span>
                <span class="form-value">${result.marksObtained || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Percentage:</span>
                <span class="form-value">${percentage}%</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Percentile Score:</span>
                <span class="form-value">${result.percentileScore || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">School Rank:</span>
                <span class="form-value">${result.schoolRank || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Zonal Rank:</span>
                <span class="form-value">${result.zonalRank || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">National Rank:</span>
                <span class="form-value">${result.nationalRank || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">International Rank:</span>
                <span class="form-value">${result.internationRank || ''}</span>
              </div>
              
              <div class="form-row">
                <span class="form-label">Qualified for 2nd Level:</span>
                <span class="form-value ${isQualified ? 'qualified-yes' : 'qualified-no'}">
                  ${isQualified ? 'YES' : 'NO'}
                </span>
              </div>
            </div>

            <!-- Performance Section -->
           
        </div>
      </body>
    </html>
  `;

  return htmlTemplate;
};

// Function to generate and open PDF in new tab with download functionality
export const generateResultCardPDF = async (resultData, studentData) => {
  try {
    // Generate HTML content
    const htmlContent = generateResultCardHTML(resultData, studentData);
    
    if (!htmlContent) {
      throw new Error('Unable to generate result card HTML');
    }

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    // Wait for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert to canvas
    const canvas = await html2canvas(container.querySelector('.card'), {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Create PDF with proper filename
    const studentName = resultData.studentName || 'Student';
    const fileName = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_Result_Card.pdf`;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Create blob with proper MIME type for PDF viewer
    const pdfBlob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open in new tab with proper PDF viewer
    const newTab = window.open('', '_blank');
    
    if (!newTab) {
      // If popup blocked, fall back to direct download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('Popup blocked. PDF downloaded directly.');
    } else {
      // Create a proper PDF viewer page
      newTab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
                background: #f5f5f5;
              }
              .pdf-container {
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
              }
              .pdf-header {
                background: #333;
                color: white;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .pdf-title {
                font-size: 16px;
                font-weight: bold;
              }
              .download-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
              }
              .download-btn:hover {
                background: #0056b3;
              }
              .pdf-viewer {
                flex: 1;
                border: none;
              }
            </style>
          </head>
          <body>
            <div class="pdf-container">
              <div class="pdf-header">
                <div class="pdf-title">Result Card - ${studentName}</div>
                <button class="download-btn" onclick="downloadPDF()">
                  📁 Download PDF
                </button>
              </div>
              <iframe class="pdf-viewer" src="${pdfUrl}" type="application/pdf"></iframe>
            </div>
            <script>
              function downloadPDF() {
                const link = document.createElement('a');
                link.href = '${pdfUrl}';
                link.download = '${fileName}';
                link.click();
              }
              
              // Auto-cleanup URL after 30 seconds
              setTimeout(() => {
                try {
                  URL.revokeObjectURL('${pdfUrl}');
                } catch(e) {}
              }, 30000);
            </script>
          </body>
        </html>
      `);
      newTab.document.close();
    }

    // Clean up URL after a longer delay for the new approach
    setTimeout(() => {
      try {
        URL.revokeObjectURL(pdfUrl);
      } catch(e) {}
    }, 60000);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
