import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { BASE_URL } from "../Api";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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

// Helper to get all qualified subjects for a student
const getQualifiedSubjects = (student, selectedExamLevel, selectedExam, examListPlainArray) => {
    // Map exam code to student field
    const examFieldMap = {
        IQEOL1: "IENGOL1",
        IQEOL2: "IENGOL2",
        IQROL1: "IAOL1",
        IQROL2: "IAOL2",
        IQSOL1: "ITSTL1",
        IQSOL2: "ITSTL2",
        IQMOL1: "IMOL1",
        IQMOL2: "IMOL2",
        IQGKOL1: "IGKOL1",
        IQGKOL2: "IGKOL2",
    };

    // Exams to check
    const examsToCheck =
        selectedExamLevel === "L1"
            ? ["IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"]
            : selectedExamLevel === "L2"
            ? ["IQEOL2", "IQROL2", "IQSOL2", "IQMOL2"]
            : ["IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"];

    // If selectedExam is used, filter further
    const filteredExams =
        selectedExam.length === 0
            ? examsToCheck
            : examsToCheck.filter((exam) => examListPlainArray.includes(exam));

    // Get qualified subjects
    return filteredExams
        .filter((exam) => student[examFieldMap[exam]] === "1")
        .map((exam) => exam.replace("L1", "").replace("L2", ""))
        .join(", ");
};

// Helper to get all participated subjects for a student
const getParticipatedSubjects = (student, selectedExamLevel, selectedExam, examListPlainArray) => {
    // Map exam code to student field
    const examFieldMap = {
        IQEOL1: "IENGOL1",
        IQEOL2: "IENGOL2",
        IQROL1: "IAOL1",
        IQROL2: "IAOL2",
        IQSOL1: "ITSTL1",
        IQSOL2: "ITSTL2",
        IQMOL1: "IMOL1",
        IQMOL2: "IMOL2",
        IQGKOL1: "IGKOL1",
        IQGKOL2: "IGKOL2",
    };

    // Exams to check
    const examsToCheck =
        selectedExamLevel === "L1"
            ? ["IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"]
            : selectedExamLevel === "L2"
            ? ["IQEOL2", "IQROL2", "IQSOL2", "IQMOL2"]
            : ["IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"];

    // If selectedExam is used, filter further
    const filteredExams =
        selectedExam.length === 0
            ? examsToCheck
            : examsToCheck.filter((exam) => examListPlainArray.includes(exam));

    // Get participated subjects (if field exists, regardless of value)
    return filteredExams
        .filter((exam) => student[examFieldMap[exam]] !== undefined)
        .map((exam) => exam.replace("L1", "").replace("L2", ""))
        .join(", ");
};

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

const QualifiedList = () => {
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
    { name: "IQEOL1", level: "L1",value:'IENGOL1' },
    { name: "IQEOL2", level: "L2",value:'IENGOL2' },
    { name: "IQROL1", level: "L1", value:'IAOL1' },
    { name: "IQROL2", level: "L2", value:'IAOL2' },
    { name: "IQSOL1", level: "L1", value:'ITSTL1' },
    { name: "IQSOL2", level: "L2", value:'ITSTL2' },
    { name: "IQMOL1", level: "L1"  , value:'IMOL1' },
    { name: "IQMOL2", level: "L2", value:'IMOL2' },
    { name: "IQGKOL1", level: "L1", value:'IGKOL1' },
    // { name: "IQGKOL2", level: "L2" },
  ];

  useEffect(() => {
    console.log("Selected Exam Level:", selectedExam);
    // Flatten the exam list to a plain array
    if(selectedExam!=''){
    const flatExams = selectedExam.map((exam) => {
      return exam.value
    });

    setExamListPlainArray(flatExams);
  }
  }, [selectedExam]);

  console.log("Exam List Plain Array:", examListPlainArray);
  // Fetch the student data based on filters
  const handleFetchStudents = async () => {
    // Require both exam level and school code to be selected
    if (!selectedExamLevel || !selectedSchoolCode) {
      alert("Please select both Exam Level and School Code!");
      return;
    }

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
    const filters = {
      examLevel: selectedExamLevel,
      exam: selectedExam || undefined,
      schoolCode: selectedSchoolCode,
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
      const res = await axios.get(
        `${BASE_URL}/fetchBLQList?examLevel=${selectedExamLevel}&schoolCode=${selectedSchoolCode}&subject=${encodeURIComponent(JSON.stringify( selectedExam))}  `,
      );
      console.log("Fetched students:", res.data);
      if (res.data.studentData) {
        setStudentsData(res.data.studentData);
        setSchool(res.data.school || {});
        setIsFetched(true);
      } else {
        setStudentsData([]);
        setIsFetched(true);
        // alert("Error fetching student data.");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setStudentsData([]);
      setIsFetched(true);
      alert("Error fetching student data.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = attendanceRef.current;

    if (!element) {
      alert("Nothing to export!");
      return;
    }

    try {
      setIsDownloading(true);
      // Store original styles
      const originalStyles = new Map();
      const saveStyles = (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const style = window.getComputedStyle(node);
          originalStyles.set(node, {
            
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            padding: style.padding,
            margin: style.margin,
            fontWeight: style.fontWeight,
            textAlign: style.textAlign,
            width: style.width,
          });

          // Apply PDF-safe styles
          node.style.color = "#000000";
          node.style.backgroundColor = "transparent";
          node.style.borderColor = "#000000";
          node.style.fontFamily = "Arial, sans-serif";
          node.style.fontSize = "12px";
          node.style.lineHeight = "1.5";

          // Center content
          if (node.tagName === "H1" || node.tagName === "H2") {
            node.style.textAlign = "center";
            node.style.textTransform = "uppercase";
            node.style.marginBottom = "6px";
            node.style.fontSize = "14px";
          }

          if (node.tagName === "P") {
            node.style.textAlign = "left";
            node.style.textTransform = "uppercase";
            node.style.marginBottom = "6px";
          }

          if (node.id == "exam-name") {
            node.style.textAlign = "center";
          }

          // Image (logo)
          if (node.tagName === "IMG") {
            node.style.display = "block";
            node.style.marginLeft = "auto";
            node.style.marginRight = "auto";
            node.style.height = "45px";
            node.style.marginBottom = "10px";
          }

          // Center grids and tables
          if (node.classList.contains("grid") || node.tagName === "TABLE") {
            node.style.width = "85%";
            node.style.marginLeft = "auto";
            node.style.marginRight = "auto";
            node.style.fontSize = "10px";
          }

          if (node.tagName === "TABLE") {
            node.style.borderCollapse = "collapse";
          }

          if (node.tagName === "TH") {
            node.style.border = "0.5px solid rgb(184, 178, 178)";
            node.style.textAlign = "center";
            node.style.padding = "3px 5px";
          }

          if (node.tagName === "TD") {
            node.style.textAlign = "center";
            node.style.padding = "3px 5px";
            node.style.boxSizing = "border-box";
          }

          if (node.tagName === "TH") {
            node.style.backgroundColor = "#e5e7eb";
            node.style.fontWeight = "600";
          }

          // Note section
          if (node.classList.contains("border-t")) {
            node.style.borderTop = "1px solid #000000";
            node.style.paddingTop = "10px";
            node.style.marginTop = "10px";
            node.style.width = "85%";
            node.style.marginLeft = "auto";
            node.style.marginRight = "auto";
            node.style.fontSize = "9px";
          }

          // Root div
          if (node.id === "download") {
            node.style.padding = "20px";
            node.style.border = "1px solid #000000";
            node.style.backgroundColor = "#ffffff";
            node.style.width = "100%";
          }

          node.childNodes.forEach(saveStyles);
        }
      };

      // Apply styles
      saveStyles(element);

      // Ensure element is fully visible for capture
      const originalPosition = element.style.position;
      const originalTop = element.style.top;
      const originalLeft = element.style.left;
      const originalWidth = element.style.width;
      element.style.position = "static";
      element.style.top = "0";
      element.style.left = "0";
      element.style.width = "100%";

      // Capture with html2canvas
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: true,
        windowWidth: element.scrollWidth + 50,
        windowHeight: element.scrollHeight + 50,
      });

      // Restore original styles and positioning
      originalStyles.forEach((styles, node) => {
        node.style.color = styles.color;
        node.style.backgroundColor = styles.backgroundColor;
        node.style.borderColor = styles.borderColor;
        node.style.fontSize = styles.fontSize;
        node.style.lineHeight = styles.lineHeight;
        node.style.padding = styles.padding;
        node.style.margin = styles.margin;
        node.style.fontWeight = styles.fontWeight;
        node.style.textAlign = styles.textAlign;
        node.style.width = styles.width;
      });
      element.style.position = originalPosition;
      element.style.top = originalTop;
      element.style.left = originalLeft;
      element.style.width = originalWidth;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate available content height per page
      const maxContentHeight = pageHeight - 2 * margin;

      // Simplified pagination logic
      if (imgHeight <= maxContentHeight) {
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          imgWidth,
          imgHeight,
          undefined,
          "SLOW"
        );
      } else {
        let position = 0;
        while (position < imgHeight) {
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          tempCanvas.width = canvas.width;
          tempCanvas.height = Math.min(
            canvas.height - (position * canvas.width) / imgWidth,
            (maxContentHeight * canvas.width) / imgWidth
          );

          tempCtx.drawImage(
            canvas,
            0,
            (position * canvas.width) / imgWidth,
            canvas.width,
            tempCanvas.height,
            0,
            0,
            canvas.width,
            tempCanvas.height
          );

          pdf.addImage(
            tempCanvas.toDataURL("image/png"),
            "PNG",
            margin,
            margin,
            imgWidth,
            Math.min(maxContentHeight, imgHeight - position),
            undefined,
            "SLOW"
          );

          position += maxContentHeight;
          if (position < imgHeight) {
            pdf.addPage();
          }
        }
      }

      // Generate filename with multiple classes and sections
      const classString = selectedClasses.map((opt) => opt.value).join("-");
      const sectionString = selectedSections.map((opt) => opt.value).join("-");
      const filename = `Attendance_${classString}_${sectionString}${
        selectedExam ? `_${selectedExam}` : ""
      }${selectedSchoolCode ? `_${selectedSchoolCode}` : ""}.pdf`;

      // Save PDF
      // pdf.save(filename);
      // alert("Attendance downloaded successfully!!");
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Check console for details.");
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
        <div className="fixed inset-0 flex  justify-end mr-[130px]">
          <div className="relative z-10 bg-white rounded-lg shadow-lg p-6 w-[80%] max-h-[95vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-6">Basic Participation List</h2>

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
                    <label className="block text-sm font-medium">Select Exam(s)</label>
                    <Select
                        isMulti
                        options={exams
                            .filter((exam) => exam.level === selectedExamLevel)
                            .map((exam) => ({
                                value: exam.value,
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
                    <label className="block text-sm font-medium">Select Classes</label>
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
            </div>
            {/* Fetch Data Button */}
            <div className="flex flex-row gap-4 justify-between mt-2 mb-4">
                <button
                    className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleFetchStudents}
                    disabled={isFetching}
                    style={{ minWidth: 140 }}
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
                        className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        style={{ minWidth: 140 }}
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
                    <th className="border px-2 py-1">Subject</th>
                    <th className="border px-2 py-1">Participation</th>
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
                        {/* Subjects Passed */}
                        <td className="border px-2 py-1">
                          {/* {
                            getQualifiedSubjects(
                              student,
                              selectedExamLevel,
                              selectedExam,
                              examListPlainArray
                            )
                          } */}
                          {}

                          {
                              

                          }
                        </td>
                        {/* Participation */}
            <td className="border px-2 py-1">
              {

              }
              
                {/* {
                    // Show "Yes" if student participated in any selected exam, else "No"
                    (() => {
                        // Map exam code to student field
                        const examFieldMap = {
                            IQEOL1: "IENGOL1",
                            IQEOL2: "IENGOL2",
                            IQROL1: "IAOL1",
                            IQROL2: "IAOL2",
                            IQSOL1: "ITSTL1",
                            IQSOL2: "ITSTL2",
                            IQMOL1: "IMOL1",
                            IQMOL2: "IMOL2",
                            IQGKOL1: "IGKOL1",
                            IQGKOL2: "IGKOL2",
                        };
                        // Exams to check
                        const examsToCheck =
                            selectedExamLevel === "L1"
                                ? ["IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"]
                                : selectedExamLevel === "L2"
                                ? ["IQEOL2", "IQROL2", "IQSOL2", "IQMOL2"]
                                : ["IQEOL1", "IQROL1", "IQSOL1", "IQMOL1", "IQGKOL1"];
                        // If selectedExam is used, filter further
                        const filteredExams =
                            selectedExam.length === 0
                                ? examsToCheck
                                : examsToCheck.filter((exam) => examListPlainArray.includes(exam));
                        // If any exam field exists (not undefined), mark as Yes
                        const participated = filteredExams.some(
                            (exam) => student[examFieldMap[exam]] !== undefined
                        );
                        return participated ? "Yes" : "No";
                    })()
                } */}
            </td>
          </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="border px-2 py-1 text-center">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualifiedList;
