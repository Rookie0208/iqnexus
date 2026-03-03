import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { BASE_URL } from "../Api";
import { Eye, Download, Search, X } from "lucide-react";

const AdmitCard = () => {
  const [students, setStudents] = useState([]);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit] = useState(10);
  const [noStudentsFound, setNoStudentsFound] = useState(false);
  const [searchData, setSearchData] = useState({
    schoolCode: "",
    examLevel: "",
    // session: "",
  });
  const [examDate, setExamDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const [schools, setSchools] = useState([]);

  // Generated Admit Cards State
  const [activeTab, setActiveTab] = useState("generate"); // "generate" or "view"
  const [generatedCards, setGeneratedCards] = useState([]);
  const [generatedCardsPage, setGeneratedCardsPage] = useState(1);
  const [generatedCardsTotalPages, setGeneratedCardsTotalPages] = useState(1);
  const [generatedCardsTotalFiles, setGeneratedCardsTotalFiles] = useState(0);
  const [generatedCardsLimit] = useState(10);
  const [generatedCardsLoading, setGeneratedCardsLoading] = useState(false);
  const [generatedCardsFilters, setGeneratedCardsFilters] = useState({
    schoolCode: "",
    examLevel: "",
    rollNo: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      const res = await axios.get(`${BASE_URL}/all-school-admit-card`);
      setSchools(res.data.schools);
    };
    fetchSchool();
  }, []);

  // const sessionOptions = [
  //   { value: "2024-25", label: "2024-25" },
  //   { value: "2025-26", label: "2025-26" },
  //   { value: "2026-27", label: "2026-27" },
  // ];

  // Reset school selection when exam level changes
  useEffect(() => {
    if (searchData.examLevel) {
      setSearchData((prev) => ({ ...prev, schoolCode: "" }));
    }
  }, [searchData.examLevel]);

  const fetchStudents = async (page, filters = {}) => {
    try {
      const hasFilters = Object.values(filters).some(
        (val) => val !== "" && val !== null && val !== undefined
      );

      if (!hasFilters) {
        setStudents([]);
        setTotalPages(1);
        setTotalStudents(0);
        setNoStudentsFound(false);
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/admit-card-students?page=${page}&limit=${limit}`,
        {
          schoolCode: filters.schoolCode && filters.schoolCode !== "ALL"
            ? Number(filters.schoolCode)
            : undefined,
          examLevel: filters.examLevel || undefined,
          allSchools: filters.schoolCode === "ALL" ? true : undefined,
        }
      );

      if (res.data.success) {
        setStudents(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalStudents(res.data.totalStudents);
        setNoStudentsFound(false);
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
      setMessage("Failed to fetch students.");
    } finally {
      setSearched(true);
    }
  };

  const handleSearchChange = (e) => {
    setSearchData({ ...searchData, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleExamLevelChange = (e) => {
    setSearchData({ ...searchData, examLevel: e.target.value });
    setMessage("");
  };

  // const handleSessionChange = (selectedOption) => {
  //   setSearchData({
  //     ...searchData,
  //     session: selectedOption ? selectedOption.value : "",
  //   });
  //   setMessage("");
  // };

  const handleExamDateChange = (e) => {
    setExamDate(e.target.value);
    setMessage("");
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setExamDate(""); // Reset examDate on new search
    await fetchStudents(1, searchData);
  };

  const handleClearFilters = () => {
    setSearchData({
      schoolCode: "",
      examLevel: "",
      // session: "",
    });
    setExamDate("");
    setSearched(false);
    setStudents([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalStudents(0);
    setNoStudentsFound(false);
    setMessage("");
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchStudents(page, searchData);
    }
  };

  const generateAllAdmitCards = async () => {
    // || !searchData.session
    if (!searchData.schoolCode || !searchData.examLevel || !examDate) {
      setMessage("Please fill all filters and select an Exam Date.");
      return;
    }

    setIsGenerating(true);
    setMessage("");

    try {
      if (searchData.schoolCode === "ALL") {
        // Generate for all schools
        let successCount = 0;
        let failCount = 0;
        for (const school of schools) {
          try {
            await axios.post(`${BASE_URL}/admit-card`, {
              schoolCode: Number(school.schoolCode),
              level: searchData.examLevel,
              examDate: examDate,
            });
            successCount++;
          } catch (err) {
            console.error(`Failed for school ${school.schoolCode}:`, err);
            failCount++;
          }
        }
        const msg = `Admit cards generated for ${successCount} schools.${failCount > 0 ? ` Failed for ${failCount} schools.` : ""}`;
        setMessage(msg);
        alert(msg);
      } else {
        const res = await axios.post(`${BASE_URL}/admit-card`, {
          schoolCode: Number(searchData.schoolCode),
          level: searchData.examLevel,
          examDate: examDate,
        });

        setMessage(res.data.message);
        alert(res.data.message);
      }
    } catch (error) {
      console.error("Error generating admit cards:", error);
      setMessage("Failed to generate admit cards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ===== Generated Admit Cards Functions =====
  const fetchGeneratedCards = async (page = 1, filters = {}) => {
    try {
      setGeneratedCardsLoading(true);
      const res = await axios.post(
        `${BASE_URL}/generated-admit-cards?page=${page}&limit=${generatedCardsLimit}`,
        {
          schoolCode: filters.schoolCode || undefined,
          examLevel: filters.examLevel || undefined,
          rollNo: filters.rollNo || undefined,
        }
      );

      if (res.data.success) {
        setGeneratedCards(res.data.data);
        setGeneratedCardsTotalPages(res.data.totalPages || 1);
        setGeneratedCardsTotalFiles(res.data.totalFiles);
      } else {
        setGeneratedCards([]);
        setGeneratedCardsTotalPages(1);
        setGeneratedCardsTotalFiles(0);
      }
    } catch (err) {
      console.error("Failed to fetch generated admit cards:", err);
      setGeneratedCards([]);
    } finally {
      setGeneratedCardsLoading(false);
    }
  };

  const handleGeneratedCardsFilterChange = (e) => {
    setGeneratedCardsFilters({
      ...generatedCardsFilters,
      [e.target.name]: e.target.value,
    });
  };

  const handleGeneratedCardsSearch = (e) => {
    e.preventDefault();
    setGeneratedCardsPage(1);
    fetchGeneratedCards(1, generatedCardsFilters);
  };

  const handleGeneratedCardsClearFilters = () => {
    setGeneratedCardsFilters({
      schoolCode: "",
      examLevel: "",
      rollNo: "",
    });
    setGeneratedCardsPage(1);
    fetchGeneratedCards(1, {});
  };

  const handleGeneratedCardsPageChange = (page) => {
    if (page >= 1 && page <= generatedCardsTotalPages) {
      setGeneratedCardsPage(page);
      fetchGeneratedCards(page, generatedCardsFilters);
    }
  };

  const handlePreview = (fileId) => {
    const url = `${BASE_URL}/download-admit-card/${fileId}`;
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/download-admit-card/${fileId}`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "admit-card.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading admit card:", error);
      alert("Failed to download admit card");
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
  };

  // Load generated cards when switching to view tab
  useEffect(() => {
    if (activeTab === "view") {
      fetchGeneratedCards(1, generatedCardsFilters);
    }
  }, [activeTab]);

  const getGeneratedCardsPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    let start = Math.max(1, generatedCardsPage - delta);
    let end = Math.min(generatedCardsTotalPages, generatedCardsPage + delta);

    if (generatedCardsPage <= delta + 1) {
      end = Math.min(generatedCardsTotalPages, delta * 2 + 1);
    }
    if (generatedCardsPage >= generatedCardsTotalPages - delta) {
      start = Math.max(1, generatedCardsTotalPages - delta * 2);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (start > 2) {
      rangeWithDots.push(1);
      rangeWithDots.push("...");
    }

    rangeWithDots.push(...range);

    if (end < generatedCardsTotalPages - 1) {
      rangeWithDots.push("...");
      rangeWithDots.push(generatedCardsTotalPages);
    } else if (end === generatedCardsTotalPages - 1) {
      rangeWithDots.push(generatedCardsTotalPages);
    }

    return rangeWithDots;
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    if (currentPage <= delta + 1) {
      end = Math.min(totalPages, delta * 2 + 1);
    }
    if (currentPage >= totalPages - delta) {
      start = Math.max(1, totalPages - delta * 2);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (start > 2) {
      rangeWithDots.push(1);
      rangeWithDots.push("...");
    }

    rangeWithDots.push(...range);

    if (end < totalPages - 1) {
      rangeWithDots.push("...");
      rangeWithDots.push(totalPages);
    } else if (end === totalPages - 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const isSearchDisabled = !(
    searchData.examLevel &&
    // searchData.session &&
    searchData.schoolCode
  );

  const isGenerateDisabled = !(
    searchData.examLevel &&
    searchData.schoolCode &&
    examDate &&
    (searchData.schoolCode === "ALL" || students.length > 0)
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Admit Card Management
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-6 py-3 font-medium text-sm transition-all duration-200 ${
              activeTab === "generate"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Generate Admit Cards
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`px-6 py-3 font-medium text-sm transition-all duration-200 ${
              activeTab === "view"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            View Generated Cards
          </button>
        </div>

        {/* Preview Modal */}
        {previewOpen && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-4xl h-5/6 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Admit Card Preview</h3>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-4">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border rounded"
                  title="Admit Card Preview"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "generate" && (
          <>
            <div className="bg-white shadow-md rounded-lg p-4 mb-6 transition-all duration-300">
              <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Exam Level
              </label>
              <select
                name="examLevel"
                value={searchData.examLevel}
                onChange={handleExamLevelChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm transition duration-150"
              >
                <option value="">Select Level</option>
                <option value="L1">Basic</option>
                <option value="L2">Advance</option>
              </select>
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                School
              </label>
              <Select
                name="schoolCode"
                options={[
                  { value: "ALL", label: "All Schools" },
                  ...schools.map((school) => ({
                    value: school.schoolCode,
                    label: `${school.schoolCode} - ${school.schoolName}`,
                  })),
                ]}
                value={
                  searchData.schoolCode
                    ? searchData.schoolCode === "ALL"
                      ? { value: "ALL", label: "All Schools" }
                      : {
                          value: searchData.schoolCode,
                          label: `${searchData.schoolCode} - ${
                            schools.find(
                              (s) =>
                                String(s.schoolCode) ===
                                String(searchData.schoolCode)
                            )?.schoolName || ""
                          }`,
                        }
                    : null
                }
                onChange={(selected) => {
                  setSearchData({
                    ...searchData,
                    schoolCode: selected ? String(selected.value) : "",
                  });
                  setMessage("");
                }}
                isClearable
                isSearchable
                placeholder="Search & select school..."
                className="basic-select"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    padding: "0",
                    fontSize: "0.875rem",
                    borderColor: "#d1d5db",
                    minHeight: "34px",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 50,
                  }),
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 text-sm hover:bg-gray-100 transition duration-150"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSearchDisabled}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md text-sm ${
              message.includes("Failed")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold text-gray-800">Students</h2>
            {students.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    name="examDate"
                    value={examDate}
                    onChange={handleExamDateChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm transition duration-150"
                  />
                </div>
                <button
                  onClick={generateAllAdmitCards}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isGenerating || isGenerateDisabled}
                >
                  {isGenerating ? (
                    <>
                      <span className="w-5 h-5 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    "Generate All Admit Cards"
                  )}
                </button>
              </div>
            )}
          </div>
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Student Name</th>
                <th className="px-6 py-3 text-left">DOB</th>
                <th className="px-6 py-3 text-left">Roll No</th>
                <th className="px-6 py-3 text-left">Mobile</th>
                <th className="px-6 py-3 text-left">School Code</th>
              </tr>
            </thead>
            <tbody>
              {searched ? (
                students.length > 0 ? (
                  students.map((stu, idx) => (
                    <tr
                      key={idx}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                            {stu.studentName.charAt(0)}
                          </div>
                          <span className="ml-3 font-medium">
                            {stu.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {stu.dob || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {stu.rollNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {stu.mobNo || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{stu.schoolCode}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {noStudentsFound
                        ? "No students found"
                        : "Loading students..."}
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Please apply filters to view students
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {searched && totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} | Showing{" "}
                {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, totalStudents)} of{" "}
                {totalStudents} students
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {getPaginationRange().map((item, idx) =>
                    item === "..." ? (
                      <span key={idx} className="px-3 py-1 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(item)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === item
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* VIEW GENERATED CARDS TAB */}
        {activeTab === "view" && (
          <>
            {/* Filters */}
            <div className="bg-white shadow-md rounded-lg p-4 mb-6">
              <form
                onSubmit={handleGeneratedCardsSearch}
                className="flex flex-wrap items-end gap-4"
              >
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Roll No
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="rollNo"
                      value={generatedCardsFilters.rollNo}
                      onChange={handleGeneratedCardsFilterChange}
                      placeholder="Search by roll no..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    School Code
                  </label>
                  <select
                    name="schoolCode"
                    value={generatedCardsFilters.schoolCode}
                    onChange={handleGeneratedCardsFilterChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                  >
                    <option value="">All Schools</option>
                    {schools.map((school) => (
                      <option key={school.schoolCode} value={school.schoolCode}>
                        {school.schoolCode} - {school.schoolName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Exam Level
                  </label>
                  <select
                    name="examLevel"
                    value={generatedCardsFilters.examLevel}
                    onChange={handleGeneratedCardsFilterChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                  >
                    <option value="">All Levels</option>
                    <option value="L1">Level 1 (Basic)</option>
                    <option value="L2">Level 2 (Advance)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGeneratedCardsClearFilters}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 text-sm hover:bg-gray-100 transition duration-150"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition duration-150"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Generated Cards Table */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  Generated Admit Cards
                  {generatedCardsTotalFiles > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({generatedCardsTotalFiles} total)
                    </span>
                  )}
                </h2>
              </div>

              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-left">Student Name</th>
                    <th className="px-6 py-3 text-left">Roll No</th>
                    <th className="px-6 py-3 text-left">School Code</th>
                    <th className="px-6 py-3 text-left">Level</th>
                    <th className="px-6 py-3 text-left">Generated Date</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedCardsLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-500">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : generatedCards.length > 0 ? (
                    generatedCards.map((card, idx) => (
                      <tr
                        key={card._id}
                        className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                              {card.student?.studentName?.charAt(0) || "?"}
                            </div>
                            <span className="ml-3 font-medium">
                              {card.student?.studentName || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {card.student?.rollNo || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {card.student?.schoolCode || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              card.examLevel === "L1"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {card.examLevel === "L1" ? "Basic" : "Advance"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {new Date(card.uploadDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handlePreview(card._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Preview"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDownload(card._id, card.filename)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              title="Download"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No generated admit cards found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination for Generated Cards */}
              {generatedCardsTotalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Page {generatedCardsPage} of {generatedCardsTotalPages} |
                    Showing {(generatedCardsPage - 1) * generatedCardsLimit + 1} to{" "}
                    {Math.min(
                      generatedCardsPage * generatedCardsLimit,
                      generatedCardsTotalFiles
                    )}{" "}
                    of {generatedCardsTotalFiles} cards
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleGeneratedCardsPageChange(generatedCardsPage - 1)
                      }
                      disabled={generatedCardsPage === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex space-x-1">
                      {getGeneratedCardsPaginationRange().map((item, idx) =>
                        item === "..." ? (
                          <span key={idx} className="px-3 py-1 text-gray-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={idx}
                            onClick={() => handleGeneratedCardsPageChange(item)}
                            className={`px-3 py-1 rounded-md ${
                              generatedCardsPage === item
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleGeneratedCardsPageChange(generatedCardsPage + 1)
                      }
                      disabled={generatedCardsPage === generatedCardsTotalPages}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdmitCard;
