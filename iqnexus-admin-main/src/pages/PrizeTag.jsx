import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Trophy,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { BASE_URL } from "../Api";
import logo from "../assets/main_logo.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ──────────────────── constants ──────────────────── */
const examOptions = [
  { value: "IQMOL1", label: "IQMO L1 (Maths)" },
  { value: "IQMOL2", label: "IQMO L2 (Maths)" },
  { value: "IQROL1", label: "IQRO L1 (Reasoning)" },
  { value: "IQROL2", label: "IQRO L2 (Reasoning)" },
  { value: "IQSOL1", label: "IQSO L1 (Science)" },
  { value: "IQSOL2", label: "IQSO L2 (Science)" },
  { value: "IQEOL1", label: "IQEO L1 (English)" },
  { value: "IQEOL2", label: "IQEO L2 (English)" },
  { value: "IQGKOL1", label: "IQGKO L1 (GK)" },
  { value: "IQGKOL2", label: "IQGKO L2 (GK)" },
  { value: "IQKD1", label: "IQKD1 (KG Exam 1)" },
  { value: "IQKD2", label: "IQKD2 (KG Exam 2)" },
];

const levelOptions = [
  { value: "basic", label: "Basic Level" },
  { value: "advance", label: "Advance Level" },
];

const examSubjectNames = {
  IQMOL1: "MATHEMATICS",
  IQMOL2: "MATHEMATICS",
  IQROL1: "REASONING & APTITUDE",
  IQROL2: "REASONING & APTITUDE",
  IQSOL1: "SCIENCE & TECHNOLOGY",
  IQSOL2: "SCIENCE & TECHNOLOGY",
  IQEOL1: "ENGLISH",
  IQEOL2: "ENGLISH",
  IQGKOL1: "GENERAL KNOWLEDGE",
  IQGKOL2: "GENERAL KNOWLEDGE",
  IQKD1: "KINDERGARTEN",
  IQKD2: "KINDERGARTEN",
};

/* ══════════════════════════════════════════════════ */
const classOptions = [
  { value: "all", label: "All Classes" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Class ${i + 1}`,
  })),
  { value: "KG", label: "KG" },
];

export default function PrizeTag() {
  const [level, setLevel] = useState("basic");
  const [exam, setExam] = useState("");
  const [classLevel, setClassLevel] = useState("all");
  const [schoolCode, setSchoolCode] = useState("");
  const [prizeFilter, setPrizeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [prizeOptions, setPrizeOptions] = useState([]);
  const certificateRef = useRef(null);

  /* ── Fetch prize-tag data from backend ── */
  const fetchData = async () => {
    if (!exam || !schoolCode) {
      setError("Please select a subject and enter a school code");
      return;
    }
    setError("");
    setLoading(true);
    setData(null);
    setExpandedRows({});
    setPrizeFilter("all");
    try {
      const { data: res } = await axios.get(`${BASE_URL}/prize-tag`, {
        params: { exam, level, schoolCode, classLevel },
      });
      if (res.success) {
        setData(res);
        setPrizeOptions(res.prizes.map((p) => p.prizeType));
      } else {
        setError(res.error || "Failed to fetch data");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Toggle student detail row ── */
  const toggleRow = (srNo) => {
    setExpandedRows((prev) => ({ ...prev, [srNo]: !prev[srNo] }));
  };

  /* ── Filtered prize list ── */
  const filteredPrizes =
    data?.prizes?.filter(
      (p) => prizeFilter === "all" || p.prizeType === prizeFilter
    ) || [];

  /* ── Download certificate as PDF ── */
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!data) return;
    setIsDownloading(true);

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();   // 210
      const H = pdf.internal.pageSize.getHeight();   // 297
      const M = 12;                                   // side margin
      const UW = W - M * 2;                           // usable width
      const CX = W / 2;
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const subjectName = examSubjectNames[exam] || exam;
      const prizes = filteredPrizes;

      /* ── Load logo ── */
      let logoB64 = null;
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = logo; });
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        logoB64 = c.toDataURL("image/png");
      } catch { /* skip */ }

      /* ═══════════════════════════════════════════════════
         PAGE 1 — Compact Professional Certificate (1 page)
         ═══════════════════════════════════════════════════ */
      // Outer border
      pdf.setDrawColor(26, 35, 126);
      pdf.setLineWidth(0.8);
      pdf.rect(5, 5, W - 10, H - 10);
      // Inner border
      pdf.setLineWidth(0.2);
      pdf.rect(7.5, 7.5, W - 15, H - 15);

      // Navy top bar
      pdf.setFillColor(26, 35, 126);
      pdf.rect(7.5, 7.5, W - 15, 2.5, "F");

      let y = 15;

      // Logo — small
      if (logoB64) {
        pdf.addImage(logoB64, "PNG", CX - 7, y, 14, 14);
        y += 16;
      }

      // Org name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(26, 35, 126);
      pdf.text("IQ NEXUS", CX, y, { align: "center" });
      y += 4.5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text("INTERNATIONAL OLYMPIAD EXAMINATIONS", CX, y, { align: "center" });
      y += 4;

      // Thin decorative lines
      pdf.setDrawColor(26, 35, 126);
      pdf.setLineWidth(0.4);
      pdf.line(M + 30, y, W - M - 30, y);
      y += 1.5;
      pdf.setDrawColor(190, 155, 50);
      pdf.setLineWidth(0.25);
      pdf.line(M + 45, y, W - M - 45, y);
      y += 6;

      // PRIZE TAG title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(26, 35, 126);
      pdf.text("PRIZE TAG", CX, y, { align: "center" });
      y += 6;

      // Level & Subject
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(70, 70, 70);
      pdf.text(`${level.toUpperCase()} LEVEL  \u2014  ${subjectName}`, CX, y, { align: "center" });
      y += 5;

      // Gold rule
      pdf.setDrawColor(190, 155, 50);
      pdf.setLineWidth(0.5);
      pdf.line(M + 35, y, W - M - 35, y);
      y += 6;

      // ── School info box ──
      const bx = M + 6;
      const bw = UW - 12;
      const bh = 22;
      pdf.setFillColor(247, 248, 255);
      pdf.setDrawColor(26, 35, 126);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(bx, y, bw, bh, 2, 2, "FD");

      const lx = bx + 5;
      const rx = bx + bw / 2 + 3;
      let iy = y + 6;

      const infoLabel = (x, yy, label, value) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(26, 35, 126);
        pdf.text(label, x, yy);
        const lw = pdf.getTextWidth(label) + 1;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
        pdf.text(String(value || ""), x + lw, yy);
      };

      infoLabel(lx, iy, "School Code: ", data.school.schoolCode);
      infoLabel(rx, iy, "School: ", data.school.schoolName);
      iy += 6;
      infoLabel(lx, iy, "City: ", data.school.city);
      infoLabel(rx, iy, "State: ", data.school.state);
      iy += 6;
      infoLabel(lx, iy, "Date: ", dateStr);
      infoLabel(rx, iy, "Exam: ", exam);

      y += bh + 6;

      // ── PRIZE SUMMARY heading ──
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(26, 35, 126);
      pdf.text("PRIZE SUMMARY", CX, y, { align: "center" });
      y += 3;

      // ── Summary table ── (compact)
      const summaryBody = prizes.map((p) => [p.srNo, p.prizeType, p.total]);

      autoTable(pdf, {
        startY: y,
        margin: { left: M + 6, right: M + 6 },
        head: [["SR", "PRIZE", "AWARDED"]],
        body: summaryBody,
        tableWidth: bw,
        styles: {
          fontSize: 7,
          font: "helvetica",
          textColor: [30, 30, 30],
          cellPadding: { top: 1.8, right: 2, bottom: 1.8, left: 2 },
          valign: "middle",
          halign: "center",
          lineWidth: 0.15,
          lineColor: [190, 190, 190],
          minCellHeight: 5.5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [26, 35, 126],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
        },
        alternateRowStyles: { fillColor: [247, 248, 255] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { halign: "left" },
          2: { cellWidth: 20, halign: "center" },
        },
      });

      const tblEnd = pdf.lastAutoTable.finalY;

      // Total row (exclude certificates — category "all")
      const totalPrizes = prizes
        .filter((p) => p.category !== "all")
        .reduce((s, p) => s + p.total, 0);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(26, 35, 126);
      pdf.text(`Total Prizes Awarded: ${totalPrizes}`, CX, tblEnd + 5, { align: "center" });

      // ── Signature section — always near bottom of page ──
      const sigY = H - 38;
      pdf.setDrawColor(120, 120, 120);
      pdf.setLineWidth(0.2);
      pdf.line(M + 12, sigY, M + 68, sigY);
      pdf.line(W - M - 68, sigY, W - M - 12, sigY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Exam Incharge / Coordinator", M + 16, sigY + 4);
      pdf.text("Principal / Head of Institution", W - M - 64, sigY + 4);

      // Bottom gold bar
      pdf.setFillColor(190, 155, 50);
      pdf.rect(7.5, H - 10, W - 15, 2.5, "F");

      // Footer copyright
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(130, 130, 130);
      pdf.text(`\u00A9 ${now.getFullYear()} IQ NEXUS \u2014 International Olympiad Examinations`, CX, H - 13, { align: "center" });

      /* ═══════════════════════════════════════════════════
         PAGE 2+ — ANNEXURES  (Student lists per prize)
         ═══════════════════════════════════════════════════ */
      const withStudents = prizes.filter((p) => p.students.length > 0);

      const drawAnnHeader = (prizeLabel, annexNo) => {
        // Top rule
        pdf.setDrawColor(26, 35, 126);
        pdf.setLineWidth(0.4);
        pdf.line(M, 8, W - M, 8);

        // Logo small
        if (logoB64) pdf.addImage(logoB64, "PNG", M, 10, 8, 8);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(26, 35, 126);
        pdf.text("IQ NEXUS", M + 10, 14.5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(110, 110, 110);
        pdf.text("INTERNATIONAL OLYMPIAD EXAMINATIONS", M + 10, 18);

        // Right side
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(26, 35, 126);
        pdf.text(`ANNEXURE ${annexNo}`, W - M, 14.5, { align: "right" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(90, 90, 90);
        pdf.text(
          `${level.toUpperCase()} | ${subjectName} | ${data.school.schoolCode} \u2014 ${data.school.schoolName}`,
          W - M, 18, { align: "right" }
        );

        // Header rule
        pdf.setDrawColor(26, 35, 126);
        pdf.setLineWidth(0.25);
        pdf.line(M, 21, W - M, 21);

        // Prize label — split prize name and total onto separate lines
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(26, 35, 126);
        const lines = pdf.splitTextToSize(prizeLabel, UW - 10);
        pdf.text(lines, CX, 25, { align: "center" });
        return 25 + lines.length * 3 + 2;
      };

      const drawAnnFooter = (pgNum) => {
        const fy = H - 8;
        pdf.setDrawColor(26, 35, 126);
        pdf.setLineWidth(0.2);
        pdf.line(M, fy - 2, W - M, fy - 2);
        pdf.setFontSize(6);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(120, 120, 120);
        pdf.text("Confidential \u2014 For Official School Use Only", M, fy);
        pdf.text(`Page ${pgNum}`, CX, fy, { align: "center" });
        pdf.text(`\u00A9 ${now.getFullYear()} IQ NEXUS`, W - M, fy, { align: "right" });
      };

      withStudents.forEach((prize, pi) => {
        pdf.addPage();
        const aNo = pi + 1;
        const prizeLines = prize.prizeType.replace(/;/g, " | ");
        const label = `${prizeLines}  \u2014  Total: ${prize.students.length}`;
        const startY = drawAnnHeader(label, aNo);
        let curPage = pdf.internal.getNumberOfPages();

        autoTable(pdf, {
          startY,
          margin: { left: M, right: M, top: 32, bottom: 14 },
          head: [["S.No", "Roll No", "Student Name", "Father Name", "Class", "Section", "Score"]],
          body: prize.students.map((s, i) => [
            i + 1,
            s.rollNo || "",
            s.studentName || "",
            s.fatherName || "",
            s.class || "",
            s.section || "",
            s.score ?? "",
          ]),
          tableWidth: UW,
          styles: {
            fontSize: 7,
            font: "helvetica",
            textColor: [30, 30, 30],
            cellPadding: { top: 1.8, right: 2.5, bottom: 1.8, left: 2.5 },
            valign: "middle",
            halign: "left",
            lineWidth: 0.15,
            lineColor: [185, 185, 185],
            minCellHeight: 5.5,
            overflow: "ellipsize",
          },
          headStyles: {
            fillColor: [26, 35, 126],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
            fontSize: 7,
            cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
          },
          alternateRowStyles: { fillColor: [247, 248, 255] },
          columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            1: { halign: "center", cellWidth: 20 },
            2: { halign: "left" },
            3: { halign: "left" },
            4: { halign: "center", cellWidth: 12 },
            5: { halign: "center", cellWidth: 14 },
            6: { halign: "center", cellWidth: 14 },
          },
          didDrawPage: () => {
            const pg = pdf.internal.getNumberOfPages();
            if (pg !== curPage) {
              const prizeLines2 = prize.prizeType.replace(/;/g, " | ");
              const label2 = `${prizeLines2}  \u2014  Total: ${prize.students.length}`;
              drawAnnHeader(label2, aNo);
              curPage = pg;
            }
            drawAnnFooter(pg);
          },
        });
      });

      if (withStudents.length === 0) {
        pdf.addPage();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(120, 120, 120);
        pdf.text("No students found for any prize.", CX, 50, { align: "center" });
      }

      pdf.save(`Prize_Tag_${data.school.schoolCode}_${exam}_${level}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Error: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ────── Header ────── */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Prize Tag</h1>
      </div>

      {/* ────── Filters ────── */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {/* Exam Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Exam Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {levelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Subject
            </label>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Select Subject</option>
              {examOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Class
            </label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {classOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* School Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              School Code
            </label>
            <input
              type="text"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="e.g. 180"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
          </div>

          {/* Prize Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Prize
            </label>
            <select
              value={prizeFilter}
              onChange={(e) => setPrizeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="all">All Prizes</option>
              {prizeOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Fetch Button */}
          <div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {loading ? "Loading…" : "Fetch"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* ────── Certificate View ────── */}
      {data && (
        <>
          {/* Download button */}
          <div className="flex justify-end mb-3">
            <button
              onClick={downloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-5 py-2 text-sm transition disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isDownloading ? "Generating…" : "Download PDF"}
            </button>
          </div>

          {/* Certificate card */}
          <div
            ref={certificateRef}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
          >
            {/* ── Top border accent ── */}
            <div className="h-2 bg-gradient-to-r from-blue-800 via-blue-600 to-yellow-500" />

            {/* ── Header with logo ── */}
            <div className="text-center py-6 px-4 bg-gradient-to-b from-blue-50 to-white">
              <img
                src={logo}
                alt="IQ Nexus"
                className="mx-auto h-16 mb-3"
                crossOrigin="anonymous"
              />
              <h2 className="text-2xl font-extrabold tracking-widest text-blue-900 uppercase">
                Prize
              </h2>
              <p className="text-base font-semibold text-gray-600 mt-1 uppercase">
                {level.toUpperCase()} LEVEL ({examSubjectNames[exam] || exam})
              </p>
            </div>

            {/* ── School info bar ── */}
            <div className="mx-6 my-4 rounded-lg bg-blue-50 border border-blue-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <div>
                <span className="font-bold text-blue-800">SCHOOL CODE: </span>
                <span className="text-gray-800">{data.school.schoolCode}</span>
              </div>
              <div>
                <span className="font-bold text-blue-800">SCHOOL NAME: </span>
                <span className="text-gray-800">{data.school.schoolName}</span>
              </div>
              <div>
                <span className="font-bold text-blue-800">CITY: </span>
                <span className="text-gray-800">{data.school.city}</span>
              </div>
              <div>
                <span className="font-bold text-blue-800">STATE: </span>
                <span className="text-gray-800">{data.school.state}</span>
              </div>
            </div>

            {/* ── Prize table ── */}
            <div className="px-6 pb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 text-left rounded-tl-lg w-16">
                      SR.NO
                    </th>
                    <th className="py-3 px-3 text-left">Prize</th>
                    <th className="py-3 px-3 text-center w-20">Config</th>
                    <th className="py-3 px-3 text-center w-20">Total</th>
                    <th
                      className="py-3 px-3 text-center w-32"
                      data-no-print="true"
                    >
                      Private Table
                    </th>
                    <th
                      className="py-3 px-3 text-center rounded-tr-lg w-40"
                      data-no-print="true"
                    >
                      Show Students
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrizes.map((prize, idx) => (
                    <React.Fragment key={prize.srNo}>
                      {/* ── Prize row ── */}
                      <tr
                        className={`border-b border-gray-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition`}
                      >
                        <td className="py-3 px-3 font-semibold text-gray-700">
                          {prize.srNo}
                        </td>
                        <td className="py-3 px-3 text-gray-800 font-medium">
                          {prize.prizeType}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block bg-gray-100 text-gray-700 font-bold rounded-full px-3 py-1 text-xs">
                            {prize.configuredMax}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block font-bold rounded-full px-3 py-1 text-xs ${
                            prize.tiedCount > 0
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {prize.total}
                          </span>
                          {prize.tiedCount > 0 && (
                            <div className="text-[10px] text-orange-600 mt-0.5">
                              {prize.tiedCount} tied
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center" data-no-print="true">
                          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-md px-3 py-1.5 transition">
                            PRIVATE TABLE
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center" data-no-print="true">
                          <button
                            onClick={() => toggleRow(prize.srNo)}
                            className={`flex items-center justify-center gap-1 mx-auto text-xs font-semibold rounded-md px-3 py-1.5 transition ${
                              expandedRows[prize.srNo]
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {expandedRows[prize.srNo] ? (
                              <>
                                <EyeOff size={14} /> HIDE
                              </>
                            ) : (
                              <>
                                <Eye size={14} /> SHOW STUDENTS
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded student details ── */}
                      {expandedRows[prize.srNo] && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 mx-2 my-2 rounded-lg overflow-hidden">
                              {prize.students.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-sm">
                                  No students found for this prize.
                                </p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-yellow-200 text-yellow-900 uppercase tracking-wider">
                                      <th className="py-2 px-3 text-left">
                                        Roll Number
                                      </th>
                                      <th className="py-2 px-3 text-left">
                                        Name
                                      </th>
                                      <th className="py-2 px-3 text-left">
                                        Father Name
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        Class
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        Section
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        Score
                                      </th>
                                      <th className="py-2 px-3 text-left">
                                        Prize
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prize.students.map((s, sIdx) => (
                                      <tr
                                        key={s.rollNo}
                                        className={
                                          sIdx % 2 === 0
                                            ? "bg-white"
                                            : "bg-yellow-50"
                                        }
                                      >
                                        <td className="py-2 px-3 font-mono">
                                          {s.rollNo}
                                        </td>
                                        <td className="py-2 px-3 font-medium">
                                          {s.studentName}
                                        </td>
                                        <td className="py-2 px-3">
                                          {s.fatherName}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {s.class}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {s.section}
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono">
                                          {s.score}
                                        </td>
                                        <td className="py-2 px-3 font-medium text-blue-700">
                                          {prize.prizeType}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {filteredPrizes.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-gray-400 py-8"
                      >
                        No prize data to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Bottom accent ── */}
            <div className="h-2 bg-gradient-to-r from-yellow-500 via-blue-600 to-blue-800" />
          </div>
        </>
      )}
    </div>
  );
}
