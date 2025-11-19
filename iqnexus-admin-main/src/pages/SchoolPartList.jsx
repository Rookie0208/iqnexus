import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { BASE_URL } from "../Api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import logo from "../assets/main_logo.png";

// List of fields that should be treated as booleans ("0" or "1")
const booleanFields = [
  "IENGOL1",
  "IENGOL1Book",
  "IENGOL2",
  "IAOL1",
  "IAOL1Book",
  "ITSTL1",
  "ITSTL1Book",
  "IMOL1",
  "IMOL1Book",
  "IGKOL1",
  "IGKOL1Book",
  "IAOL2",
  "ITSTL2",
  "IMOL2",
  "Duplicates",
];

// Map exam codes to full names
const examFullNames = {
  IQEOL1: {
    fullName: "IQNEXUS ENGLISH OLYMPIAD",
    code: "IQEO",
    level: "Level 1",
  },
  IQEOL2: {
    fullName: "IQNEXUS ENGLISH OLYMPIAD",
    code: "IQEO",
    level: "Level 2",
  },
  IQROL1: {
    fullName: "IQNEXUS REASONING OLYMPIAD",
    code: "IQRO",
    level: "Level 1",
  },
  IQROL2: {
    fullName: "IQNEXUS REASONING OLYMPIAD",
    code: "IQRO",
    level: "Level 2",
  },
  IQSOL1: {
    fullName: "IQNEXUS SCIENCE OLYMPIAD",
    code: "IQSO",
    level: "Level 1",
  },
  IQSOL2: {
    fullName: "IQNEXUS SCIENCE OLYMPIAD",
    code: "IQSO",
    level: "Level 2",
  },
  IQMOL1: {
    fullName: "IQNEXUS MATHEMATICS OLYMPIAD",
    code: "IQMO",
    level: "Level 1",
  },
  IQMOL2: {
    fullName: "IQNEXUS MATHEMATICS OLYMPIAD",
    code: "IQMO",
    level: "Level 2",
  },
  IQGKOL1: {
    fullName: "IQNEXUS GENERAL KNOWLEDGE OLYMPIAD",
    code: "IQGKO",
    level: "Level 1",
  },
  IQGKOL2: {
    fullName: "IQNEXUS GENERAL KNOWLEDGE OLYMPIAD",
    code: "IQGKO",
    level: "Level 2",
  },
};

const SchoolPartList = () => {
  const [students, setStudents] = useState([]);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [examListPlainArray, setExamListPlainArray] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [noStudentsFound, setNoStudentsFound] = useState(false);
  const [searchData, setSearchData] = useState({
    studentName: "",
    classes: [],
    schoolCode: null,
    rollNo: "",
    sections: [],
    pages: "",
    subject: "",
    totalPages: null,
  });
  const [limit] = useState(10);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedExamLevel, setSelectedExamLevel] = useState("");
  const [selectedExam, setSelectedExam] = useState([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [school, setSchool] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [pages, setPages] = useState(10);
  const attendanceRef = useRef(null);
  console.log("selected exam", selectedExam);
  const exams = [
    { name: "IQKDL1", level: "L1" },
    { name: "IQKDL2", level: "L2" },
    { name: "IQEOL1", level: "L1" },
    { name: "IQEOL2", level: "L2" },
    { name: "IQROL1", level: "L1" },
    { name: "IQROL2", level: "L2" },
    { name: "IQSOL1", level: "L1" },
    { name: "IQSOL2", level: "L2" },
    { name: "IQMOL1", level: "L1" },
    { name: "IQMOL2", level: "L2" },
    { name: "IQGKOL1", level: "L1" },
    // { name: "IQGKOL2", level: "L2" },
  ];

  useEffect(() => {
    console.log("Selected Exam Level:", selectedExam);
    // Flatten the exam list to a plain array and map display names to database names
    if(selectedExam!=''){
    const flatExams = selectedExam.map((exam) => {
      // Map kindergarten display names to database field names
      if (exam.value === "IQKDL1") return "IQKD1";
      if (exam.value === "IQKDL2") return "IQKD2";
      return exam.value;
    });

    setExamListPlainArray(flatExams);
  }
  }, [selectedExam]);

  console.log("Exam List Plain Array:", examListPlainArray);
  // Fetch the student data based on filters
  const handleFetchStudents = async () => {
    if (selectedExamLevel || selectedExam.length>0 || selectedSchoolCode || selectedClasses.length > 0 || selectedSections.length > 0) {

    let selectedExamNew = [];
    if (selectedExamLevel === "L1" && !selectedExam) {
      selectedExamNew = [
        { value: "IQEOL1", level: "L1" },
        { value: "IQROL1", level: "L1" },
        { value: "IQSOL1", level: "L1" },
        { value: "IQMOL1", level: "L1" },
        { value: "IQGKOL1", level: "L1" },
      ];
    }
    
    // Map display names to database field names for kindergarten exams
    const mappedExams = selectedExam.map(exam => {
      if (exam.value === "IQKDL1") {
        return { ...exam, value: "IQKD1" };
      } else if (exam.value === "IQKDL2") {
        return { ...exam, value: "IQKD2" };
      }
      return exam;
    });

    const filters = {
      examLevel: selectedExamLevel,
      exam: mappedExams || undefined,
      schoolCode: selectedSchoolCode || undefined,
      classes:
        selectedClasses.length > 0
          ? selectedClasses.map((opt) => opt.value)
          : undefined,
      sections:
        selectedSections.length > 0
          ? selectedSections.map((opt) => opt.value)
          : undefined,
    };
  

    try {
      setIsFetching(true);
      const res = await axios.post(
        `${BASE_URL}/participation-list-filtered`,
        filters
      );
      console.log("Fetched students:", res.data.student);
      if (res.data.student) {
        setStudentsData(res.data.student);
        setSchool(res.data.school || {});
        setIsFetched(true);
      } else {
        setStudentsData([]);
        setIsFetched(true);
        alert("Error fetching student data.");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setStudentsData([]);
      setIsFetched(true);
      alert("Error fetching student data.");
    } finally {
      setIsFetching(false);
    }
  }
    else  {
          alert("Please select atleast one filter!");
      return;
    
  }
  };

  const handleDownloadPDF = () => {
    if (!studentsData.length) {
      alert("No student data to export!");
      return;
    }

    try {
      setIsDownloading(true);

      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const sideMargin = 16;
      const topMargin = 72;
      const bottomMargin = 22;
      const usableWidth = pageWidth - sideMargin * 2;
      const now = new Date();
      const formattedDate = now.toLocaleString();
      const academicYear = now.getMonth() >= 3
        ? `${now.getFullYear()}-${now.getFullYear() + 1}`
        : `${now.getFullYear() - 1}-${now.getFullYear()}`;

      const getExamLevelText = () => {
        if (selectedExamLevel === "L2") return "Advance Level";
        if (selectedExamLevel === "L1") return "Basic Level";
        return "All Levels";
      };

      const codeToField = {
        IQKDL1: "IQKD1",
        IQKDL2: "IQKD2",
        IQEOL1: "IENGOL1",
        IQEOL2: "IENGOL2",
        IQROL1: "IAOL1",
        IQROL2: "IAOL2",
        IQSOL1: "ITSTL1",
        IQSOL2: "ITSTL2",
        IQMOL1: "IMOL1",
        IQMOL2: "IMOL2",
        IQGKOL1: "IGKOL1",
      };

      const baseExamSets = {
        L1: ["IQKDL1", "IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"],
        L2: ["IQKDL2", "IQEOL2", "IQROL2", "IQSOL2", "IQMOL2"],
      };

      const levelKey = selectedExamLevel === "L2" ? "L2" : "L1";
      const baseCodes = baseExamSets[levelKey];
      const allowedCodes = baseCodes.filter(
        (code) =>
          selectedExam.length === 0 ||
          examListPlainArray.includes(code)
      );

      const examColumns = allowedCodes.map((code) => {
        const labelFromMap = examFullNames[code]?.code;
        const shortLabel = code
          .replace(/L[12]/g, "")
          .replace(/[12]$/, "");
        return {
          code,
          field: codeToField[code],
          label: labelFromMap || shortLabel,
        };
      });

      const drawHeader = () => {
        const centerX = pageWidth / 2;
        const logoSize = 20;
        const infoStartY = 40;
        const participationTitle = selectedExamLevel === "L2"
          ? "Participation List Advance"
          : "Participation List Basic";
        const levelSubtitle = selectedExamLevel
          ? selectedExamLevel === "L2" ? "ADVANCE LEVEL" : "BASIC LEVEL"
          : "EXAM LEVEL NOT SELECTED";

        pdf.addImage(logo, "PNG", centerX - logoSize / 2, 12, logoSize, logoSize);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(22, 27, 35);
        pdf.text("IQ Nexus", centerX, 36, { align: "center" });

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(80, 80, 80);
        pdf.text(participationTitle, centerX, 44, { align: "center" });
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(levelSubtitle, centerX, 50, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        pdf.setTextColor(60, 60, 60);

        pdf.text(`School Name: ${school?.schoolName || "ALL"}`, sideMargin, infoStartY);
        pdf.text(`School Code: ${school?.schoolCode || selectedSchoolCode || "ALL"}`, sideMargin, infoStartY + 6);
        pdf.text(`City / Area: ${school?.city || "ALL"} / ${school?.area || "ALL"}`, sideMargin, infoStartY + 12);
        pdf.text(`Exam Incharge: ${school?.incharge || "ALL"}`, sideMargin, infoStartY + 18);

        const examText = selectedExam.length
          ? examListPlainArray.join(", ")
          : "All Exams";
        pdf.text(`Exam Level: ${getExamLevelText()}`, pageWidth - sideMargin, infoStartY, { align: "right" });
        pdf.text(`Exam(s): ${examText}`, pageWidth - sideMargin, infoStartY + 6, { align: "right" });
        pdf.text(`Generated: ${formattedDate}`, pageWidth - sideMargin, infoStartY + 12, { align: "right" });
        pdf.text(`Academic Year: ${academicYear}`, pageWidth - sideMargin, infoStartY + 18, { align: "right" });

        pdf.setDrawColor(185, 185, 185);
        pdf.line(sideMargin, infoStartY + 22, pageWidth - sideMargin, infoStartY + 22);
      };

      const drawFooter = (pageNumber, totalPages) => {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(90, 90, 90);
        pdf.text("Confidential - School Copy", pageWidth / 2, pageHeight - 12, { align: "center" });
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: "center" });
      };

      drawHeader();

      const headRow = [
        "S.No",
        "Roll No",
        "Student Name",
        "Father",
        "Mother",
        "Class",
        "Sec",
        ...examColumns.map((col) => col.label),
      ];

      const bodyRows = studentsData.map((student, index) => {
        const baseCells = [
          index + 1,
          student.rollNo || "",
          student.studentName || "",
          student.fatherName || "",
          student.motherName || "",
          student.class || "",
          student.section || "",
        ];

        examColumns.forEach(({ field }) => {
          const value = student[field];
          baseCells.push(value === "1" || value === 1 ? "YES" : "NO");
        });

        return baseCells;
      });

      autoTable(pdf, {
        startY: topMargin,
        margin: { left: sideMargin, right: sideMargin, top: topMargin, bottom: bottomMargin },
        head: [headRow],
        body: bodyRows,
        tableWidth: usableWidth,
        styles: {
          fontSize: 8,
          font: "helvetica",
          textColor: [30, 30, 30],
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          valign: "middle",
          halign: "left",
          lineWidth: 0.3,
          lineColor: [160, 160, 160],
          minCellHeight: 9,
        },
        headStyles: {
          fillColor: [235, 235, 235],
          textColor: [30, 30, 30],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "center", cellWidth: 20 },
          2: { halign: "left", cellWidth: 38 },
          3: { halign: "left", cellWidth: 32 },
          4: { halign: "left", cellWidth: 32 },
          5: { halign: "center", cellWidth: 16 },
          6: { halign: "center", cellWidth: 14 },
        },
        didDrawPage: (data) => {
          drawHeader();
          drawFooter(data.pageNumber, pdf.internal.getNumberOfPages());
        },
      });

      const finalY = pdf.lastAutoTable.finalY || topMargin;
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(70, 70, 70);
      pdf.text("Teacher / Invigilator Signature:", sideMargin, finalY + 10);
      pdf.line(sideMargin, finalY + 12, sideMargin + 55, finalY + 12);
      pdf.text("Principal / Coordinator Signature:", pageWidth - sideMargin, finalY + 10, { align: "right" });
      pdf.line(pageWidth - sideMargin - 55, finalY + 12, pageWidth - sideMargin, finalY + 12);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(110, 110, 110);
      pdf.text(
        "IMPORTANT NOTE: Certificates will be printed as per the above details. Kindly verify spellings before signing.",
        sideMargin,
        finalY + 20
      );

      const fileNameParts = [
        "Participation",
        selectedExamLevel || "AllLevels",
        examColumns.length ? examColumns.map((col) => col.code).join("-") : "AllExams",
        selectedSchoolCode || school?.schoolCode || "AllSchools",
      ];

      pdf.save(`${fileNameParts.filter(Boolean).join("_")}.pdf`);
      alert("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download PDF. Error: " + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch all students for Excel download without pagination
  const fetchAllStudentsForExcel = async (filters) => {
    try {
      const hasFilters = Object.values(filters).some(
        (val) =>
          (Array.isArray(val) ? val.length > 0 : val !== "" && val !== null) &&
          val !== undefined
      );

      let res;
      if (hasFilters) {
        res = await axios.post(`${BASE_URL}/all-students-no-pagination`, {
          schoolCode: filters.schoolCode
            ? Number(filters.schoolCode)
            : undefined,
          className: filters.classes.length > 0 ? filters.classes : undefined,
          rollNo: filters.rollNo || undefined,
          section: filters.sections.length > 0 ? filters.sections : undefined,
          studentName: filters.studentName || undefined,
          subject: filters.subject || undefined,
        });
      } else {
        res = await axios.post(`${BASE_URL}/all-students-no-pagination`, {});
      }

      if (res.data.success) {
        return res.data.data || [];
      } else {
        alert("No students found for the selected filters.");
        return [];
      }
    } catch (err) {
      console.error("Failed to fetch all students for Excel:", err);
      alert("Failed to fetch students for Excel download.");
      return [];
    }
  };

  // Handle Excel download
  const handleDownloadExcel = async () => {
    const allStudents = await fetchAllStudentsForExcel(searchData);
    if (allStudents.length === 0) {
      alert("No student data to export!");
      return;
    }

    try {
      const subjectNameMap = {
        IMOL: "IQMO",
        ITSTL: "IQSO",
        IENGOL: "IQEO",
        IAOL: "IQRO",
        IGKOL: "IQGKO",
      };

      // Prepare data for Excel
      const excelData = allStudents.map((student, index) => {
        const booleanMappedFields = booleanFields.reduce((acc, field) => {
          // Replace subject codes with mapped labels in the Excel column name
          let replacedField = field;
          Object.entries(subjectNameMap).forEach(([code, label]) => {
            if (field.includes(code)) {
              replacedField = field.replace(code, label);
            }
          });

          acc[replacedField] =
            student[field] === "1" || student[field] === true ? "Yes" : "No";
          return acc;
        }, {});

        return {
          "S.No": index + 1,
          "Student Name": student.studentName || "ALL",
          DOB: student.dob || "ALL",
          "Roll No": student.rollNo || "ALL",
          Mobile: student.mobNo || "ALL",
          "School Code": student.schoolCode || "ALL",
          Class: student.class || "ALL",
          Section: student.section || "ALL",
          "Father Name": student.fatherName || "ALL",
          "Mother Name": student.motherName || "ALL",
          ...booleanMappedFields,
          "Total Basic Level Participated Exams":
            student.totalBasicLevelParticipatedExams,
          "Basic Level Full Amount": student.basicLevelFullAmount,
          "Basic Level Paid Amount": student.basicLevelAmountPaid,
          "Basic Level Amount Paid Online": student.basicLevelAmountPaidOnline,
          "Is Basic Level Concession Given":
            student.isBasicLevelConcessionGiven,
          "Concession Reason": student.concessionReason,
          "Parents Working School": student.ParentsWorkingschool,
          Designation: student.designation,
          City: student.city || "ALL",
          "Advance Level Paid Amount": student.advanceLevelAmountPaid,
          "Advance Level Amount Paid Online":
            student.advanceLevelAmountPaidOnline,
          "Total Amount Paid": student.totalAmountPaid,
          "Total Amount Paid Online": student.totalAmountPaidOnline,
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");

      // Generate filename based on filters
      const classString =
        searchData.classes.length > 0 ? searchData.classes.join("-") : "All";
      const sectionString =
        searchData.sections.length > 0 ? searchData.sections.join("-") : "All";
      const filename = `Students_${classString}_${sectionString}${
        searchData.schoolCode ? `_${searchData.schoolCode}` : ""
      }${searchData.subject ? `_${searchData.subject}` : ""}.xlsx`;

      // Download Excel file
      XLSX.writeFile(wb, filename);
      alert("Student data downloaded successfully as Excel!");
    } catch (err) {
      console.error("Excel generation failed:", err);
      alert("Failed to generate Excel file. Check console for details.");
    }
  };

  // Predefined class options
  const classOptions = [
    { value: "KD", label: "Kindergarten (KD)" },
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
    { value: "5", label: "Class 5" },
    { value: "6", label: "Class 6" },
    { value: "7", label: "Class 7" },
    { value: "8", label: "Class 8" },
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" },
  ];

  // Predefined section options
  const sectionOptions = [
    { value: "LKG", label: "LKG (Lower Kindergarten)" },
    { value: "UKG", label: "UKG (Upper Kindergarten)" },
    { value: "PG", label: "PG (Pre-Primary/Play Group)" },
    { value: "A", label: "Section A" },
    { value: "B", label: "Section B" },
    { value: "C", label: "Section C" },
    { value: "D", label: "Section D" },
    { value: "E", label: "Section E" },
  ];

  const dropdown = [
    { value: "10", label: "10 dataset" },
    { value: "25", label: "25 dataset" },
    { value: "50", label: "50 dataset" },
  ];

  useEffect(() => {
    fetchStudents(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (searchData.totalPages) {
      console.log("Search data before change:", searchData.totalPages);
      fetchStudents(1, searchData);
    }
  }, [searchData]);
  const fetchStudents = async (page, filters = {}) => {
    try {
      let res;
      const hasFilters = Object.values(searchData).some(
        (val) =>
          (Array.isArray(val) ? val.length > 0 : val !== "" && val !== null) &&
          val !== undefined
      );
      console.log("Fetching students with filters:", hasFilters);
      if (hasFilters) {
        res = await axios.post(
          `${BASE_URL}/students?page=${page}&limit=${
            searchData.totalPages || limit
          }`,
          {
            schoolCode: searchData.schoolCode
              ? Number(searchData.schoolCode)
              : undefined,
            className:
              searchData.classes.length > 0 ? searchData.classes : undefined,
            rollNo: searchData.rollNo,
            section:
              searchData.sections.length > 0 ? searchData.sections : undefined,
            studentName: searchData.studentName,
            subject: searchData.subject,
          }
        );
      } else {
        console.log("Fetching all students without filters");
        res = await axios.get(
          `${BASE_URL}/all-students?page=${page}&limit=${limit}`
        );
      }

      if (res.data.success) {
        setStudents(hasFilters ? res.data.data : res.data.allStudents);
        setTotalPages(res.data.totalPages || 1);
        setTotalStudents(res.data.totalStudents);
      } else {
        setStudents([]);
        setTotalPages(1);
        setTotalStudents(0);
        setNoStudentsFound(true);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
      setTotalPages(1);
      setTotalStudents(0);
      alert("Failed to fetch students.");
    } finally {
      setSearched(true);
    }
  };



  return (
    <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-end">
      {/* Participationlist */}
      <div>
        <div className="fixed inset-0 flex items-center justify-end mr-[130px]">
          <div className="relative z-10 bg-white rounded-lg shadow-lg p-6 w-[80%] max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Basic Participation List</h2>

            {/* Filters Form */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Exam Level</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={selectedExamLevel}
                  onChange={(e) => setSelectedExamLevel(e.target.value)}
                >
                  <option value="">Select Level</option>
                  <option value="L1">Basic</option>
                  <option value="L2">Advance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Select Exam(s)
                </label>
                <Select
                  isMulti
                  options={exams
                    .filter((exam) => exam.level === selectedExamLevel)
                    .map((exam) => ({
                      value: exam.name,
                      label: exam.name,
                    }))}
                  value={selectedExam}
                  onChange={(selected) => setSelectedExam(selected)}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select exam(s)..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      padding: "0.1rem",
                      fontSize: "0.875rem",
                      borderColor: "black",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50,
                    }),
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">School Code</label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={selectedSchoolCode}
                  onChange={(e) => setSelectedSchoolCode(e.target.value)}
                  placeholder="Enter School Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Select Classes
                </label>
                <Select
                  isMulti
                  options={classOptions}
                  value={selectedClasses}
                  onChange={setSelectedClasses}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select classes..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      padding: "0.1rem",
                      fontSize: "0.875rem",
                      borderColor: "black",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50,
                    }),
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Select Sections
                </label>
                <Select
                  isMulti
                  options={sectionOptions}
                  value={selectedSections}
                  onChange={setSelectedSections}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select sections..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      padding: "0.1rem",
                      fontSize: "0.875rem",
                      borderColor: "black",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50,
                    }),
                  }}
                />
              </div>
            </div>
            {/* Fetch Data Button */}
            <div className="flex justify-between mt-2 mb-4">
              
              <button
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleFetchStudents}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <span className="w-5 h-5 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Fetching...
                  </>
                ) : (
                  "Fetch Students"
                )}
              </button>

               {isFetched && (
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Downloading...
                    </>
                  ) : (
                    "Download PDF"
                  )}
                </button>
              )}
            </div>

            {/* Preview Student Data */}
            <div
              id="download"
              style={{ color: "#000000", backgroundColor: "#ffffff" }}
              className="bg-white p-7 rounded-lg shadow-md border text-sm w-full"
              ref={attendanceRef}
            >
              <div className="text-center mb-6">
                <img src={logo} alt="IQ Nexus" className="mx-auto h-12 mb-2" />
                <h1 className="text-lg font-semibold uppercase">
                  Participation List Basic
                </h1>
                <h2 className="font-bold uppercase underline mt-2">
                  {selectedExamLevel
                    ? `${selectedExamLevel === "L1" ? "Basic" : "Advance"}`
                    : "Exam Level Not Selected"}
                </h2>
              </div>
              <div className="grid grid-cols-2 text-xs mb-6 gap-y-2">
                <div id="top-left">
                  <p>
                    <strong>School Name:</strong> {school.schoolName || "ALL"}
                  </p>
                  <p>
                    <strong>School Code:</strong> {school.schoolCode || "ALL"}
                  </p>
                  <p>
                    <strong>City:</strong> {school.city || "ALL"}
                  </p>
                  <p>
                    <strong>Area:</strong> {school.area || "ALL"}
                  </p>
                </div>
                <div className="ml-[60%]">
                  <p>
                    <strong>Exam Incharge:</strong> {school.incharge || "ALL"}
                  </p>
                  <p>
                    <strong>Print Date:</strong>{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <table className="table-auto w-full border text-center text-xs mb-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">S.No</th>
                    <th className="border px-2 py-1">Roll No</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Father</th>
                    <th className="border px-2 py-1">Mother</th>
                    <th className="border px-2 py-1">Class</th>
                    <th className="border px-2 py-1">Sec</th>

                    {(
                      selectedExamLevel === "L1"
                      ? ["IQKD1", "IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"]
                      : selectedExamLevel === "L2"
                      ? ["IQKD2", "IQEOL2", "IQROL2", "IQSOL2", "IQMOL2"]
                      : ["IQKD1", "IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"]
                    ).map((examCode) => (
                     ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes(examCode))) &&
                      <th className="border px-2 py-1" key={examCode}>
                        {examCode === "IQKD1" || examCode === "IQKD2" 
                          ? "IQKD" 
                          : examCode.replace("L1", "").replace("L2", "").replace("1", "").replace("2", "")
                        }
                      </th>
                    ))}
                    
                  </tr>
                </thead>
                <tbody>
                  {studentsData.length > 0 ? (
                    studentsData.map((student, index) => (
                      <tr key={student._id || index}>
                        <td className="border px-2 py-1">{index + 1}</td>
                        <td className="border px-2 py-1">{student.rollNo}</td>
                        <td className="border px-2 py-1">
                          {student.studentName}
                        </td>
                        <td className="border px-2 py-1">
                          {student.fatherName || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {student.motherName || ""}
                        </td>
                        <td className="border px-2 py-1">{student.class}</td>
                        <td className="border px-2 py-1">{student.section}</td>


                        {
                        selectedExamLevel === "" ||
                        selectedExamLevel === "L1" ? (
                ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQKD1'))) &&
                          <td className="border px-2 py-1">
                            {student.IQKD1 === "1" ? "YES" : "NO"}
                          </td>
                        ) : (

                       ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQKD2'))) &&
                          <td className="border px-2 py-1">
                            {
                            student.IQKD2 === "1" ? "YES" : "NO"
                            }
                          </td>

                        )
                        }

                        {
                        selectedExamLevel === "" ||
                        selectedExamLevel === "L1" ? (
                ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQEOL1'))) &&
                          <td className="border px-2 py-1">
                            {student.IENGOL1 === "1" ? "YES" : "NO"}
                          </td>
                        ) : (

                       ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQEOL2'))) &&
                          <td className="border px-2 py-1">
                            {
                            student.IENGOL2 === "1" ? "YES" : "NO"
                            }
                          </td>

                        )
                        }

                        {
                        selectedExamLevel === "" ||
                        selectedExamLevel === "L1" ? 
                         ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQROL1'))) &&
                        (
                          <td className="border px-2 py-1">
                            {student.IAOL1 === "1" ? "YES" : "NO"}
                          </td>
                        ) : (
                           ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQROL2'))) &&
                          <td className="border px-2 py-1">
                            {student.IAOL2 === "1" ? "YES" : "NO"}
                          </td>
                        )}

                        {
                        selectedExamLevel === "" ||
                        selectedExamLevel === "L1" ? (
                          ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQSOL1'))) &&
                          <td className="border px-2 py-1">
                            {student.ITSTL1 === "1" ? "YES" : "NO"}
                          </td>
                        ) : (
                          ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQSOL2'))) &&
                          <td className="border px-2 py-1">
                            {student.ITSTL2 === "1" ? "YES" : "NO"}
                          </td>
                        )}

                        {
                        selectedExamLevel === "" ||
                        selectedExamLevel === "L1" ? (
                          ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQMOL1'))) &&
                          <td className="border px-2 py-1">
                            {student.IMOL1 === "1" ? "YES" : "NO"}
                          </td>
                        ) : (
                          ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQMOL2'))) &&
                          <td className="border px-2 py-1">
                            {student.IMOL2 === "1" ? "YES" : "NO"}
                          </td>
                        )}

                        {/* last column */}
                        {
                        (selectedExamLevel === "" || selectedExamLevel === "L1" ) && 

                              ( selectedExam.length===0 || ( selectedExam.length>0  && examListPlainArray.includes('IQGKOL1'))) &&
                            <td className="border px-2 py-1">
                              {student.IGKOL1 === "1" ? "YES" : "NO"}
                            </td>
                          }
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={20} className="text-center py-3">
                        No student data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="grid grid-cols-2 text-xs mb-2">
                <div>
                  <p>
                    <strong>Present Student:</strong>{" "}
                    {/* {studentsData.filter((s) => s[selectedExam] === "1").length} */}
                  </p>
                  <p>
                    <strong>Absent Student:</strong>{" "}
                    {/* {studentsData.filter((s) => s[selectedExam] !== "1").length} */}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Information Filled By:</strong>{" "}
                    ______________________
                  </p>
                  <p>
                    <strong>Mobile No:</strong> ____________________
                  </p>
                  <p>
                    <strong>Sign:</strong> ____________________
                  </p>
                </div>
              </div>
              <div className="text-xs border-t pt-2 mt-2">
                <strong>IMPORTANT NOTE:</strong> Please note that we shall print
                certificates as per the above details. So this is very important
                to check the spelling and correct if found wrong. So ask every
                participant to cross check their details and then sign on it. We
                will not re-print the certificate(s) after that.
              </div>
              <div className="mt-2"></div>
            </div>

            {/* Actions */}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolPartList;
