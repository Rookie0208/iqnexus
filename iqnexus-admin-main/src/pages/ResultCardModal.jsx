import React, { useRef, useState } from "react";
import { X, Download, Eye, EyeOff } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ResultCardModal = ({ isOpen, onClose, result, config }) => {
  const resultCardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  if (!isOpen || !result) return null;

  const student = result.student || {};
  const resultData = result.result || {};
  const topicPerformance = result.topicPerformance || [];
  // Use rankVisibility from result (API response) first, then fallback to config
  const rankVisibility = result.rankVisibility || config?.rankVisibility || {
    schoolRank: true,
    zonalRank: true,
    nationalRank: true,
    internationalRank: true,
    classRank: true,
    sectionRank: true
  };

  // Check if student is absent or disqualified
  const attendance = resultData.attendance?.toUpperCase() || "PRESENT";
  const isAbsent = () => attendance === "ABSENT";
  const isDisqualified = () => attendance === "DISQUALIFIED";
  const isNotPresent = () => isAbsent() || isDisqualified();

  // Get level from subject
  const getLevel = () => {
    const subject = resultData.subject || '';
    if (subject.includes('L2') || subject.includes('Level 2') || subject.includes('ADVANCE')) {
      return 'ADVANCE LEVEL';
    }
    return 'BASIC LEVEL';
  };

  // Get rating text color (Tailwind classes)
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

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!resultCardRef.current) {
      console.error('Result card ref not found');
      alert('Unable to generate PDF. Please try again.');
      return;
    }

    setIsDownloading(true);
    try {
      const element = resultCardRef.current;
      
      // Clone element to avoid modifying the original
      const clone = element.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = element.offsetWidth + 'px';
      document.body.appendChild(clone);

      // Convert all oklch colors to rgb
      const convertColors = (el) => {
        const computed = window.getComputedStyle(el);
        const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
        props.forEach(prop => {
          const value = computed[prop];
          if (value && value.includes('oklch')) {
            // Force to a safe fallback
            if (prop === 'backgroundColor') {
              el.style.backgroundColor = value.includes('0 0 0') ? '#000' : value.includes('1 0 0') ? '#fff' : '#f3f4f6';
            } else if (prop === 'color') {
              el.style.color = '#000';
            } else {
              el.style[prop] = '#000';
            }
          }
        });
        Array.from(el.children).forEach(convertColors);
      };
      convertColors(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const margin = 10;
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);
      
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const imgX = (pdfWidth - finalWidth) / 2;
      const imgY = margin;

      pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
      pdf.save(`Result_${student.rollNo || 'Student'}_${resultData.subject || 'Exam'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Error: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Get AI Chart range based on percentage
  const getAIChartRange = (percentage) => {
    if (percentage >= 80) return '80-100%';
    if (percentage >= 70) return '70-80%';
    if (percentage >= 60) return '60-70%';
    if (percentage >= 45) return '45-60%';
    return '0-45%';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-auto">
        {/* Modal Header - Controls */}
        <div className="sticky top-0 z-10 bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Result Card</h2>
          <div className="flex items-center gap-3">
            {/* Toggle Detailed View - Admin Only */}
            <button
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              title={showDetailedView ? 'Hide detailed view' : 'Show detailed view'}
            >
              {showDetailedView ? <EyeOff size={16} /> : <Eye size={16} />}
              {showDetailedView ? 'Simple' : 'Detailed'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
            >
              <Download size={16} />
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Result Card Content - for PDF */}
        <div ref={resultCardRef} className="p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header with Logo */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-black">
            <div>
              <h1 className="text-2xl font-bold text-black uppercase tracking-wide">
                {resultData.subject || 'PAPER NAME'}
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
                  ? 'The student was absent for this examination.' 
                  : 'The student has been disqualified from this examination.'}
              </p>
            </div>
          )}

          {/* Student Details Table */}
          <table className="w-full mb-6 border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-2 font-semibold bg-gray-100 w-1/4">STUDENT NAME</td>
                <td className="border border-black px-3 py-2 uppercase">{student.studentName || 'N/A'}</td>
                <td className="border border-black px-3 py-2 font-semibold bg-gray-100 w-1/4">ROLL NO</td>
                <td className="border border-black px-3 py-2">{student.rollNo || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-2 font-semibold bg-gray-100">CLASS</td>
                <td className="border border-black px-3 py-2">{student.studentClass || 'N/A'}</td>
                <td className="border border-black px-3 py-2 font-semibold bg-gray-100">SECTION</td>
                <td className="border border-black px-3 py-2">{student.section || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-2 font-semibold bg-gray-100">SCHOOL</td>
                <td className="border border-black px-3 py-2 uppercase" colSpan="3">{student.schoolName || 'N/A'}</td>
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

          {/* Topic-wise Performance - Only for present students */}
          {!isNotPresent() && topicPerformance && topicPerformance.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-black uppercase mb-2 border-b border-black pb-1">
                SUBJECT PERFORMANCE REPORT (SPR)
              </h3>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black px-2 py-2 text-left font-bold">TOPIC</th>
                    <th className="border border-black px-2 py-2 text-center font-bold">PERCENTAGE</th>
                    {showDetailedView && (
                      <>
                        <th className="border border-black px-2 py-2 text-center font-bold">SCORE</th>
                        <th className="border border-black px-2 py-2 text-center font-bold">TOTAL Q</th>
                        <th className="border border-black px-2 py-2 text-center font-bold">CORRECT</th>
                        <th className="border border-black px-2 py-2 text-center font-bold">WRONG</th>
                        <th className="border border-black px-2 py-2 text-center font-bold">N/A</th>
                      </>
                    )}
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
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {topic.displayPercentage || `${topic.percentage || 0}%`}
                      </td>
                      {showDetailedView && (
                        <>
                          <td className="border border-black px-2 py-2 text-center">{topic.marks || 0}</td>
                          <td className="border border-black px-2 py-2 text-center">{topic.totalQuestions}</td>
                          <td className="border border-black px-2 py-2 text-center">{topic.correct}</td>
                          <td className="border border-black px-2 py-2 text-center">{topic.wrong}</td>
                          <td className="border border-black px-2 py-2 text-center">{topic.notAttempted}</td>
                        </>
                      )}
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
                    <td className="border border-black px-2 py-2 text-center">
                      {resultData.percentage?.toFixed(1) || 0}%
                    </td>
                    {showDetailedView && (
                      <>
                        <td className="border border-black px-2 py-2 text-center">
                          {topicPerformance.reduce((sum, t) => sum + (t.marks || 0), 0)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          {topicPerformance.reduce((sum, t) => sum + (t.totalQuestions || 0), 0)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          {topicPerformance.reduce((sum, t) => sum + (t.correct || 0), 0)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          {topicPerformance.reduce((sum, t) => sum + (t.wrong || 0), 0)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          {topicPerformance.reduce((sum, t) => sum + (t.notAttempted || 0), 0)}
                        </td>
                      </>
                    )}
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
      </div>
    </div>
  );
};

export default ResultCardModal;
