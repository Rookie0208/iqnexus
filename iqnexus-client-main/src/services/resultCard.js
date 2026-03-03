import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Function to generate and open PDF in new tab with download functionality
export const generateResultCardPDF = async (resultData, studentData) => {
  try {
    // Extract result data
    const resultKey = Object.keys(resultData).find(
      (key) => key !== "success" && key !== "studentName"
    );
    const result = resultData[resultKey];

    if (!result) {
      throw new Error("No result data found");
    }

    // Determine level
    const subjectName = resultKey || "";
    const lastTwoChars = subjectName.slice(-2).toUpperCase();
    const isBasicLevel = lastTwoChars === "L1";
    const levelText = isBasicLevel
      ? "BASIC LEVEL RESULT"
      : "ADVANCED LEVEL RESULT";

    // Parse scores
    const marksObtained = result.total?.score ?? result.marksObtained ?? 0;
    const totalMarks = result.total?.totalCount ?? result.totalMarks ?? 100;
    const percentage =
      result.total?.percentage ?? Math.round((marksObtained / totalMarks) * 100);
    const rank = result.total?.rank ?? "";
    const hasNewFormat = result.section1 !== undefined;
    const isQualified =
      result.passOrFail?.toUpperCase() === "PASS";
    const studentName =
      resultData.studentName ||
      studentData["Student's Name"] ||
      "N/A";

    // ── Create PDF ──
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    // Decorative border
    pdf.setDrawColor(26, 54, 93);
    pdf.setLineWidth(0.8);
    pdf.rect(7, 7, pageWidth - 14, pageHeight - 14);
    pdf.setDrawColor(44, 82, 130);
    pdf.setLineWidth(0.3);
    pdf.rect(9, 9, pageWidth - 18, pageHeight - 18);

    // ── Load logo ──
    let logoBase64 = null;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = "/main_logo.png";
      });
      const cvs = document.createElement("canvas");
      cvs.width = img.naturalWidth;
      cvs.height = img.naturalHeight;
      cvs.getContext("2d").drawImage(img, 0, 0);
      logoBase64 = cvs.toDataURL("image/png");
    } catch {
      /* skip logo */
    }

    // ── Header ──
    if (logoBase64) {
      pdf.addImage(logoBase64, "PNG", pageWidth / 2 - 15, y, 30, 10);
      y += 13;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(26, 54, 93);
    pdf.text("IQ NEXUS ACADEMY", pageWidth / 2, y, { align: "center" });
    y += 7;

    pdf.setFontSize(12);
    pdf.setTextColor(44, 82, 130);
    pdf.text(levelText, pageWidth / 2, y, { align: "center" });
    y += 5;

    // Gold decorative line
    pdf.setDrawColor(201, 168, 76);
    pdf.setLineWidth(0.6);
    pdf.line(margin + 20, y, pageWidth - margin - 20, y);
    y += 7;

    // ── Student Information Table ──
    const infoRows = [
      ["STUDENT NAME", String(studentName).toUpperCase()],
      ["ROLL NO", String(studentData["Roll No"] || "")],
      ["CLASS", String(studentData["Class"] || "")],
      ["SECTION", String(studentData["Section"] || "")],
      ["SCHOOL", String(studentData["School"] || "")],
      ["ATTENDANCE", String(result.attendance || "PRESENT").toUpperCase()],
      ["TOTAL SCORE", `${marksObtained} / ${totalMarks}`],
      ["PERCENTAGE", `${percentage}%`],
    ];

    if (rank) infoRows.push(["RANK", String(rank)]);
    if (result.percentileScore)
      infoRows.push(["PERCENTILE SCORE", String(result.percentileScore)]);
    if (result.schoolRank)
      infoRows.push(["SCHOOL RANK", String(result.schoolRank)]);
    if (result.zonalRank)
      infoRows.push(["ZONAL RANK", String(result.zonalRank)]);
    if (result.nationalRank)
      infoRows.push(["NATIONAL RANK", String(result.nationalRank)]);
    if (result.internationRank)
      infoRows.push(["INTERNATIONAL RANK", String(result.internationRank)]);

    infoRows.push([
      "QUALIFIED FOR LEVEL 2",
      isQualified ? "YES" : "NO",
    ]);

    autoTable(pdf, {
      startY: y,
      body: infoRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [44, 82, 130],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        valign: "middle",
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          fillColor: [235, 240, 250],
          cellWidth: 55,
          textColor: [26, 54, 93],
        },
        1: { cellWidth: pageWidth - 2 * margin - 55 },
      },
      didParseCell: (data) => {
        // Highlight qualified row
        if (
          data.section === "body" &&
          data.row.index === infoRows.length - 1
        ) {
          const isYes = data.row.raw[1] === "YES";
          if (data.column.index === 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = isYes
              ? [22, 163, 74]
              : [220, 38, 38];
          }
        }
        // Bold student name
        if (data.section === "body" && data.row.index === 0 && data.column.index === 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: margin, right: margin },
    });
    y = pdf.lastAutoTable.finalY + 8;

    // ── Section-wise Performance Table ──
    if (hasNewFormat) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(26, 54, 93);
      pdf.text("SECTION-WISE PERFORMANCE", margin, y);
      y += 1;
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 3;

      const sectionHead = [
        ["Section", "Score", "%", "Correct", "Total Q", "Unattempted"],
      ];
      const sectionBody = [];
      let totalScore = 0;
      let totalQuestions = 0;
      let totalCorrect = 0;
      let totalUnattempted = 0;

      [1, 2, 3, 4, 5].forEach((num) => {
        const sec = result[`section${num}`];
        if (sec) {
          sectionBody.push([
            `Section ${num}`,
            String(sec.score || 0),
            `${sec.percentage || 0}%`,
            String(sec.correctCount || 0),
            String(sec.totalCount || 0),
            String(sec.unAttempted || 0),
          ]);
          totalScore += sec.score || 0;
          totalQuestions += sec.totalCount || 0;
          totalCorrect += sec.correctCount || 0;
          totalUnattempted += sec.unAttempted || 0;
        }
      });

      // Grand total row
      sectionBody.push([
        "TOTAL",
        String(totalScore),
        `${percentage}%`,
        String(totalCorrect),
        String(totalQuestions),
        String(totalUnattempted),
      ]);

      autoTable(pdf, {
        startY: y,
        head: sectionHead,
        body: sectionBody,
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: 2.8,
          halign: "center",
          valign: "middle",
          lineColor: [44, 82, 130],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [26, 54, 93],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        bodyStyles: {
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [240, 245, 255],
        },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [230, 238, 250] },
        },
        didParseCell: (data) => {
          // Style grand total row
          if (
            data.section === "body" &&
            data.row.index === sectionBody.length - 1
          ) {
            data.cell.styles.fillColor = [26, 54, 93];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          }
        },
        margin: { left: margin, right: margin },
      });
      y = pdf.lastAutoTable.finalY + 8;
    }

    // ── Footer ──
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "This is a computer-generated result card. For any queries, please contact the school coordinator.",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 3;
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `\u00A9 ${new Date().getFullYear()} IQ NEXUS ACADEMY - All Rights Reserved`,
      pageWidth / 2,
      y,
      { align: "center" }
    );

    // Confidential footer
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      "CONFIDENTIAL - IQ Nexus Academy",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // ── Output ──
    const fileName = `${studentName.replace(/[^a-zA-Z0-9]/g, "_")}_Result_Card.pdf`;

    const pdfBlob = new Blob([pdf.output("blob")], {
      type: "application/pdf",
    });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const newTab = window.open("", "_blank");

    if (!newTab) {
      // Fallback to direct download if popup blocked
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Popup blocked. PDF downloaded directly.");
    } else {
      newTab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
              .pdf-container { width: 100%; height: 100vh; display: flex; flex-direction: column; }
              .pdf-header { background: #1a365d; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
              .pdf-title { font-size: 16px; font-weight: bold; }
              .download-btn { background: #c9a84c; color: #1a365d; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; }
              .download-btn:hover { background: #b89640; }
              .pdf-viewer { flex: 1; border: none; }
            </style>
          </head>
          <body>
            <div class="pdf-container">
              <div class="pdf-header">
                <div class="pdf-title">Result Card - ${studentName}</div>
                <button class="download-btn" onclick="downloadPDF()">Download PDF</button>
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
              setTimeout(() => { try { URL.revokeObjectURL('${pdfUrl}'); } catch(e) {} }, 30000);
            </script>
          </body>
        </html>
      `);
      newTab.document.close();
    }

    setTimeout(() => {
      try {
        URL.revokeObjectURL(pdfUrl);
      } catch (e) {}
    }, 60000);

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
