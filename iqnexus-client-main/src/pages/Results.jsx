import React, { useEffect, useState, useRef } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Results = () => {
  const student = useSelector((state) => state.auth.user);
  const [result, setResult] = useState(null);
  const [publishedResults, setPublishedResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const resultCardRef = useRef(null);

  // Subject options
  const subjectOptions = [
    { value: 'IQMOL1', label: 'IQMO Level 1 (Mathematics)' },
    { value: 'IQMOL2', label: 'IQMO Level 2 (Mathematics)' },
    { value: 'IQROL1', label: 'IQRO Level 1 (Reasoning)' },
    { value: 'IQROL2', label: 'IQRO Level 2 (Reasoning)' },
    { value: 'IQSOL1', label: 'IQSO Level 1 (Science)' },
    { value: 'IQSOL2', label: 'IQSO Level 2 (Science)' },
    { value: 'IQEOL1', label: 'IQEO Level 1 (English)' },
    { value: 'IQEOL2', label: 'IQEO Level 2 (English)' },
    { value: 'IQGKOL1', label: 'IQGKO Level 1 (GK)' },
    { value: 'IQGKOL2', label: 'IQGKO Level 2 (GK)' },
  ];

  // Fetch published result for a specific subject
  const fetchPublishedResult = async (subject) => {
    try {
      setIsLoading(true);
      setError(false);
      const rollNo = student?.["Roll No"] || student?.rollNo || "";
      
      const res = await axios.get(`${BASE_API_URL}/published-result`, {
        params: { rollNo, subject }
      });
      
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setResult(null);
        if (res.data.message === 'Results not published yet') {
          setError('not_published');
        } else {
          setError('not_found');
        }
      }
    } catch (err) {
      console.error("Error fetching result:", err);
      if (err.response?.data?.message === 'Results not published yet') {
        setError('not_published');
      } else {
        setError('not_found');
      }
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subject selection
  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    if (subject) {
      fetchPublishedResult(subject);
    } else {
      setResult(null);
    }
  };

  // Get level from subject
  const getLevel = () => {
    if (!selectedSubject) return 'BASIC LEVEL';
    if (selectedSubject.includes('L2') || selectedSubject.includes('Level 2')) {
      return 'ADVANCE LEVEL';
    }
    return 'BASIC LEVEL';
  };

  // Get rating text color
  const getRatingTextColor = (rating) => {
    const colors = {
      'EXCELLENT': 'text-green-600',
      'GOOD': 'text-blue-600',
      'AVERAGE': 'text-yellow-600',
      'IMPROVE': 'text-orange-600',
      'BAD': 'text-red-600'
    };
    return colors[rating] || 'text-gray-600';
  };

  // Get AI Chart range based on percentage
  const getAIChartRange = (percentage) => {
    if (percentage >= 80) return '80-100%';
    if (percentage >= 70) return '70-80%';
    if (percentage >= 60) return '60-70%';
    if (percentage >= 45) return '45-60%';
    return '0-45%';
  };

  // Check attendance status
  const attendance = result?.result?.attendance?.toUpperCase() || "PRESENT";
  const isAbsent = () => attendance === "ABSENT";
  const isDisqualified = () => attendance === "DISQUALIFIED";
  const isNotPresent = () => isAbsent() || isDisqualified();

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!result) return;

    setIsDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      // ── Decorative border ──
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
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "/main_logo.png"; });
        const cvs = document.createElement("canvas");
        cvs.width = img.naturalWidth; cvs.height = img.naturalHeight;
        cvs.getContext("2d").drawImage(img, 0, 0);
        logoBase64 = cvs.toDataURL("image/png");
      } catch { /* skip logo */ }

      // ── Header ──
      if (logoBase64) {
        pdf.addImage(logoBase64, "PNG", pageWidth - margin - 32, y, 30, 10);
      }
      const examLabel = subjectOptions.find(s => s.value === selectedSubject)?.label.split(" (")[0] || "EXAM";
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(26, 54, 93);
      pdf.text(examLabel.toUpperCase(), margin, y + 5);
      pdf.setFontSize(11);
      pdf.setTextColor(44, 82, 130);
      pdf.text(`${getLevel()} RESULT`, margin, y + 11);
      y += 15;

      // Decorative line
      pdf.setDrawColor(201, 168, 76);
      pdf.setLineWidth(0.6);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;

      // ── Absent / Disqualified banner ──
      if (isNotPresent()) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, y, pageWidth - 2 * margin, 12, "F");
        pdf.setDrawColor(0); pdf.setLineWidth(0.5);
        pdf.rect(margin, y, pageWidth - 2 * margin, 12, "S");
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text(isAbsent() ? "ABSENT" : "DISQUALIFIED", pageWidth / 2, y + 6, { align: "center" });
        pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(80, 80, 80);
        pdf.text(
          isAbsent() ? "You were absent for this examination." : "You have been disqualified from this examination.",
          pageWidth / 2, y + 10, { align: "center" }
        );
        y += 16;
      }

      // ── Student Details Table ──
      const studentRows = [
        ["STUDENT NAME", studentData.studentName?.toUpperCase() || "N/A", "ROLL NO", String(studentData.rollNo || "N/A")],
        ["CLASS", String(studentData.studentClass || "N/A"), "SECTION", String(studentData.section || "N/A")],
        ["SCHOOL", studentData.schoolName?.toUpperCase() || "N/A", "", ""],
      ];
      if (!isNotPresent()) {
        studentRows.push(
          ["MARK SCORED", `${resultData.totalScore ?? 0} / ${resultData.totalMaxScore || resultData.totalMarks || 100}`, "PERCENTAGE", `${resultData.percentage?.toFixed(1) || 0}%`],
          ["PERCENTILE", String(resultData.percentile?.toFixed(1) || 0), "OVERALL RATING", String(result.overallRating || "N/A")]
        );
      }

      autoTable(pdf, {
        startY: y,
        body: studentRows,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [44, 82, 130], lineWidth: 0.2, textColor: [0, 0, 0] },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [235, 240, 250], cellWidth: 38 },
          1: { cellWidth: 55 },
          2: { fontStyle: "bold", fillColor: [235, 240, 250], cellWidth: 38 },
          3: { cellWidth: 55 },
        },
        didParseCell: (data) => {
          // School row spans 2 cols
          if (data.row.index === 2 && data.column.index === 1) {
            data.cell.colSpan = 3;
          }
        },
        margin: { left: margin, right: margin },
      });
      y = pdf.lastAutoTable.finalY + 6;

      // ── Rankings section ──
      if (!isNotPresent()) {
        const rankItems = [];
        if (rankVisibility.schoolRank && resultData.schoolRank > 0) rankItems.push(["SCHOOL", String(resultData.schoolRank)]);
        if (rankVisibility.classRank && resultData.classRank > 0) rankItems.push(["CLASS", String(resultData.classRank)]);
        if (rankVisibility.sectionRank && resultData.sectionRank > 0) rankItems.push(["SECTION", String(resultData.sectionRank)]);
        if (rankVisibility.zonalRank && resultData.cityRank > 0) rankItems.push(["ZONAL", String(resultData.cityRank)]);
        if (rankVisibility.nationalRank && resultData.nationalRank > 0) rankItems.push(["NATIONAL", String(resultData.nationalRank)]);
        if (rankVisibility.internationalRank && resultData.internationalRank > 0) rankItems.push(["INT'L", String(resultData.internationalRank)]);

        if (rankItems.length > 0) {
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
          pdf.setTextColor(26, 54, 93);
          pdf.text("RANKINGS", margin, y);
          y += 1;
          pdf.setDrawColor(0); pdf.setLineWidth(0.3);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 3;

          const boxW = (pageWidth - 2 * margin) / Math.min(rankItems.length, 6);
          rankItems.forEach(([label, value], idx) => {
            const bx = margin + idx * boxW;
            pdf.setDrawColor(44, 82, 130); pdf.setLineWidth(0.3);
            pdf.rect(bx, y, boxW, 14, "S");
            pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 100, 100);
            pdf.text(label, bx + boxW / 2, y + 4, { align: "center" });
            pdf.setFontSize(13); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
            pdf.text(value, bx + boxW / 2, y + 11, { align: "center" });
          });
          y += 18;
        }

        // ── Qualified status ──
        if (resultData.qualifiedForLevel2 !== undefined) {
          pdf.setFillColor(resultData.qualifiedForLevel2 ? 235 : 250, resultData.qualifiedForLevel2 ? 245 : 235, resultData.qualifiedForLevel2 ? 235 : 235);
          pdf.rect(margin, y, pageWidth - 2 * margin, 8, "F");
          pdf.setDrawColor(0); pdf.setLineWidth(0.4);
          pdf.rect(margin, y, pageWidth - 2 * margin, 8, "S");
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
          const qualText = resultData.qualifiedForLevel2 ? "\u2713 QUALIFIED FOR LEVEL 2" : "\u2717 NOT QUALIFIED FOR LEVEL 2";
          pdf.text(qualText, pageWidth / 2, y + 5.5, { align: "center" });
          y += 12;
        }

        // ── Topic Performance Table ──
        if (topicPerformance && topicPerformance.length > 0) {
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
          pdf.setTextColor(26, 54, 93);
          pdf.text("SUBJECT PERFORMANCE REPORT (SPR)", margin, y);
          y += 1;
          pdf.setDrawColor(0); pdf.setLineWidth(0.3);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 2;

          const topicHead = [["TOPIC", "RATING", "AI CHART"]];
          const topicBody = topicPerformance.map((topic, i) => [
            `${i + 1}. ${(topic.topicName || `SECTION ${i + 1}`).toUpperCase()}`,
            topic.rating || "N/A",
            getAIChartRange(topic.percentage || 0),
          ]);
          topicBody.push([
            "TOTAL",
            result.overallRating || "N/A",
            getAIChartRange(resultData.percentage || 0),
          ]);

          const ratingColors = {
            EXCELLENT: [22, 163, 74],
            GOOD: [37, 99, 235],
            AVERAGE: [202, 138, 4],
            IMPROVE: [234, 88, 12],
            BAD: [220, 38, 38],
          };

          autoTable(pdf, {
            startY: y,
            head: topicHead,
            body: topicBody,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2.5, lineColor: [44, 82, 130], lineWidth: 0.2, valign: "middle" },
            headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontStyle: "bold" },
            columnStyles: {
              0: { cellWidth: 90, fontStyle: "bold" },
              1: { halign: "center", cellWidth: 35 },
              2: { halign: "center", cellWidth: 35, textColor: [100, 100, 100] },
            },
            didParseCell: (data) => {
              if (data.section === "body" && data.column.index === 1) {
                const rating = data.cell.raw;
                if (ratingColors[rating]) {
                  data.cell.styles.textColor = ratingColors[rating];
                  data.cell.styles.fontStyle = "bold";
                }
              }
              // Total row styling
              if (data.section === "body" && data.row.index === topicBody.length - 1) {
                data.cell.styles.fillColor = [240, 240, 240];
                data.cell.styles.fontStyle = "bold";
              }
            },
            margin: { left: margin, right: margin },
          });
          y = pdf.lastAutoTable.finalY + 5;
        }
      }

      // ── Rating Legend ──
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(7.5); pdf.setTextColor(0, 0, 0);
      pdf.text("RATING SCALE:", margin, y);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(80, 80, 80);
      pdf.text("EXCELLENT (80-100%)  |  GOOD (70-80%)  |  AVERAGE (60-70%)  |  IMPROVE (45-60%)  |  BAD (0-45%)", margin + 22, y);
      y += 6;

      // ── Footer ──
      pdf.setDrawColor(0); pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
      pdf.setFontSize(7); pdf.setTextColor(100, 100, 100);
      pdf.text("This is a computer-generated result. For any queries, please contact the school coordinator.", pageWidth / 2, y, { align: "center" });
      y += 3;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(7);
      pdf.text(`\u00A9 ${new Date().getFullYear()} IQ NEXUS - All Rights Reserved`, pageWidth / 2, y, { align: "center" });

      // Page number bottom
      pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
      pdf.text("CONFIDENTIAL - IQ Nexus Academy", pageWidth / 2, pageHeight - 10, { align: "center" });

      pdf.save(`Result_${studentData.rollNo || "Student"}_${selectedSubject || "Exam"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const studentData = result?.student || {};
  const resultData = result?.result || {};
  const topicPerformance = result?.topicPerformance || [];
  const rankVisibility = result?.rankVisibility || {
    schoolRank: true,
    zonalRank: true,
    nationalRank: true,
    internationalRank: true,
    classRank: true,
    sectionRank: true
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Result Card</h1>
          <p className="text-gray-600">View and download your exam results</p>
        </div>

        {/* Subject Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Subject/Exam</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {subjectOptions.map((subject) => (
              <button
                key={subject.value}
                onClick={() => handleSubjectChange(subject.value)}
                className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                  selectedSubject === subject.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject.label.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Loader2 className="text-gray-600 animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-600">Loading results...</p>
            </div>
          </div>
        )}

        {/* Error States */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-lg shadow p-6 text-center max-w-md">
              <FileText className={`mx-auto mb-4 ${error === 'not_published' ? 'text-yellow-500' : 'text-red-500'}`} size={40} />
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {error === 'not_published' ? 'Results Not Published Yet' : 'Result Not Found'}
              </h3>
              <p className="text-gray-600 text-sm">
                {error === 'not_published' 
                  ? 'The results for this exam have not been published yet. Please check back later.'
                  : 'No results available for the selected exam. Please contact support if you believe this is an error.'}
              </p>
            </div>
          </div>
        )}

        {/* No Subject Selected */}
        {!isLoading && !error && !selectedSubject && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-lg shadow p-6 text-center max-w-md">
              <FileText className="text-gray-400 mx-auto mb-4" size={40} />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Select an Exam</h3>
              <p className="text-gray-600 text-sm">Please select a subject/exam from the options above to view your results.</p>
            </div>
          </div>
        )}

        {/* Result Card */}
        {!isLoading && !error && result && (
          <>
            {/* Download Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Download size={16} />
                {isDownloading ? 'Generating PDF...' : 'Download Result Card'}
              </button>
            </div>

            {/* Result Card Content - for PDF */}
            <div ref={resultCardRef} className="bg-white rounded-lg shadow p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
              
              {/* Header with Logo */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-black">
                <div>
                  <h1 className="text-2xl font-bold text-black uppercase tracking-wide">
                    {subjectOptions.find(s => s.value === selectedSubject)?.label.split(' (')[0] || 'PAPER NAME'}
                  </h1>
                  <p className="text-lg font-semibold text-gray-700 mt-1">
                    {getLevel()} RESULT
                  </p>
                </div>
                <div className="text-right">
                  <img 
                    src="/main_logo.png" 
                    alt="IQ NEXUS" 
                    className="h-16 w-auto ml-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-xl font-bold text-black">IQ NEXUS</div>
                </div>
              </div>

              {/* Absent/Disqualified Banner */}
              {isNotPresent() && (
                <div className="mb-6 p-4 border-2 border-black bg-gray-100 text-center">
                  <p className="text-xl font-bold text-black uppercase">
                    {isAbsent() ? 'ABSENT' : 'DISQUALIFIED'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {isAbsent() 
                      ? 'You were absent for this examination.' 
                      : 'You have been disqualified from this examination.'}
                  </p>
                </div>
              )}

              {/* Student Details Table */}
              <table className="w-full mb-6 border-collapse border border-black text-sm">
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-2 font-semibold bg-gray-100 w-1/4">STUDENT NAME</td>
                    <td className="border border-black px-3 py-2 uppercase">{studentData.studentName || 'N/A'}</td>
                    <td className="border border-black px-3 py-2 font-semibold bg-gray-100 w-1/4">ROLL NO</td>
                    <td className="border border-black px-3 py-2">{studentData.rollNo || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 font-semibold bg-gray-100">CLASS</td>
                    <td className="border border-black px-3 py-2">{studentData.studentClass || 'N/A'}</td>
                    <td className="border border-black px-3 py-2 font-semibold bg-gray-100">SECTION</td>
                    <td className="border border-black px-3 py-2">{studentData.section || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 font-semibold bg-gray-100">SCHOOL</td>
                    <td className="border border-black px-3 py-2 uppercase" colSpan="3">{studentData.schoolName || 'N/A'}</td>
                  </tr>
                  {!isNotPresent() && (
                    <>
                      <tr>
                        <td className="border border-black px-3 py-2 font-semibold bg-gray-100">MARK SCORED</td>
                        <td className="border border-black px-3 py-2 font-bold">{resultData.totalScore ?? 0} / {resultData.totalMaxScore || resultData.totalMarks || 100}</td>
                        <td className="border border-black px-3 py-2 font-semibold bg-gray-100">PERCENTAGE</td>
                        <td className="border border-black px-3 py-2 font-bold">{resultData.percentage?.toFixed(1) || 0}%</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-3 py-2 font-semibold bg-gray-100">PERCENTILE</td>
                        <td className="border border-black px-3 py-2">{resultData.percentile?.toFixed(1) || 0}</td>
                        <td className="border border-black px-3 py-2 font-semibold bg-gray-100">OVERALL RATING</td>
                        <td className="border border-black px-3 py-2 font-bold">{result.overallRating || 'N/A'}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Rankings - Only for present students */}
              {!isNotPresent() && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-black uppercase mb-2 border-b border-black pb-1">RANKINGS</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                    {rankVisibility.schoolRank && resultData.schoolRank > 0 && (
                      <div className="border border-black p-2 text-center">
                        <p className="text-xs text-gray-600">SCHOOL</p>
                        <p className="text-lg font-bold">{resultData.schoolRank}</p>
                      </div>
                    )}
                    {rankVisibility.classRank && resultData.classRank > 0 && (
                      <div className="border border-black p-2 text-center">
                        <p className="text-xs text-gray-600">CLASS</p>
                        <p className="text-lg font-bold">{resultData.classRank}</p>
                      </div>
                    )}
                    {rankVisibility.sectionRank && resultData.sectionRank > 0 && (
                      <div className="border border-black p-2 text-center">
                        <p className="text-xs text-gray-600">SECTION</p>
                        <p className="text-lg font-bold">{resultData.sectionRank}</p>
                      </div>
                    )}
                    {rankVisibility.zonalRank && resultData.cityRank > 0 && (
                      <div className="border border-black p-2 text-center">
                        <p className="text-xs text-gray-600">ZONAL</p>
                        <p className="text-lg font-bold">{resultData.cityRank}</p>
                      </div>
                    )}
                    {rankVisibility.nationalRank && resultData.nationalRank > 0 && (
                      <div className="border border-black p-2 text-center">
                        <p className="text-xs text-gray-600">NATIONAL</p>
                        <p className="text-lg font-bold">{resultData.nationalRank}</p>
                      </div>
                    )}
                    {rankVisibility.internationalRank && resultData.internationalRank > 0 && (
                      <div className="border border-black p-2 text-center">
                        <p className="text-xs text-gray-600">INT'L</p>
                        <p className="text-lg font-bold">{resultData.internationalRank}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Qualified Status - Only for present students */}
              {!isNotPresent() && resultData.qualifiedForLevel2 !== undefined && (
                <div className={`mb-6 p-3 border-2 border-black text-center ${resultData.qualifiedForLevel2 ? 'bg-gray-100' : ''}`}>
                  <p className="font-bold text-black">
                    {resultData.qualifiedForLevel2 
                      ? '✓ QUALIFIED FOR LEVEL 2' 
                      : '✗ NOT QUALIFIED FOR LEVEL 2'}
                  </p>
                </div>
              )}

              {/* Topic-wise Performance (Simple View) - Only for present students */}
              {!isNotPresent() && topicPerformance && topicPerformance.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-black uppercase mb-2 border-b border-black pb-1">
                    SUBJECT PERFORMANCE REPORT (SPR)
                  </h3>
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-black px-2 py-2 text-left font-bold">TOPIC</th>
                        <th className="border border-black px-2 py-2 text-center font-bold">RATING</th>
                        <th className="border border-black px-2 py-2 text-center font-bold">AI CHART</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topicPerformance.map((topic, index) => (
                        <tr key={index}>
                          <td className="border border-black px-2 py-2 font-medium">
                            {index + 1}. {topic.topicName?.toUpperCase() || `SECTION ${index + 1}`}
                          </td>
                          <td className={`border border-black px-2 py-2 text-center font-bold ${getRatingTextColor(topic.rating)}`}>
                            {topic.rating}
                          </td>
                          <td className="border border-black px-2 py-2 text-center text-gray-600">
                            {getAIChartRange(topic.percentage || 0)}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-black px-2 py-2">TOTAL</td>
                        <td className={`border border-black px-2 py-2 text-center ${getRatingTextColor(result.overallRating)}`}>
                          {result.overallRating || 'N/A'}
                        </td>
                        <td className="border border-black px-2 py-2 text-center text-gray-600">
                          {getAIChartRange(resultData.percentage || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Rating Legend */}
              <div className="mb-6 text-xs">
                <p className="font-bold mb-1">RATING SCALE:</p>
                <p className="text-gray-600">
                  EXCELLENT (80-100%) | GOOD (70-80%) | AVERAGE (60-70%) | IMPROVE (45-60%) | BAD (0-45%)
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-black text-center text-xs text-gray-600">
                <p>This is a computer-generated result. For any queries, please contact the school coordinator.</p>
                <p className="mt-1 font-semibold">© {new Date().getFullYear()} IQ NEXUS - All Rights Reserved</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  ); 
};

export default Results;
