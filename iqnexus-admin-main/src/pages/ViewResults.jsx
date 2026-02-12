import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { BASE_URL } from "../Api";
import * as XLSX from "xlsx";
import { 
  Search, Download, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, FileText, 
  Settings, Save, Send, EyeOff, Check, X, Loader2, Trophy, Target, User, AlertCircle
} from "lucide-react";
import ResultCardModal from "./ResultCardModal";

const ViewResults = () => {
  const [results, setResults] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Single Result Modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  
  // Exam config warning
  const [hasExamConfig, setHasExamConfig] = useState(true);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  // Inline status message (replaces alerts)
  const [fetchMessage, setFetchMessage] = useState(null);
  
  // Configuration Panel
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Topic names for configuration
  const [topicNames, setTopicNames] = useState({
    section1: 'Section 1',
    section2: 'Section 2',
    section3: 'Section 3',
    section4: 'Section 4',
    section5: 'Section 5'
  });

  // Rank visibility toggles
  const [rankVisibility, setRankVisibility] = useState({
    schoolRank: true,
    zonalRank: true,
    nationalRank: true,
    internationalRank: true,
    classRank: true,
    sectionRank: true
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(50);

  // Filters
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchRollNo, setSearchRollNo] = useState("");
  const [sortBy, setSortBy] = useState({ value: 'total.score', label: 'Score' });
  const [sortOrder, setSortOrder] = useState({ value: 'desc', label: 'High to Low' });

  // Class options
  const classOptions = [
    { value: 'all', label: 'All Classes' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))
  ];

  // Section options
  const sectionOptions = [
    { value: 'all', label: 'All Sections' },
    ...['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(s => ({ value: s, label: `Section ${s}` }))
  ];

  // Subject/Exam options
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

  // Sort options
  const sortOptions = [
    { value: 'total.score', label: 'Score' },
    { value: 'internationalRank', label: 'International Rank' },
    { value: 'nationalRank', label: 'National Rank' },
    { value: 'cityRank', label: 'City Rank' },
    { value: 'schoolRank', label: 'School Rank' },
    { value: 'classRank', label: 'Class Rank' },
    { value: 'sectionRank', label: 'Section Rank' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'High to Low' },
    { value: 'asc', label: 'Low to High' },
  ];

  const rankLabels = {
    schoolRank: 'School Rank',
    classRank: 'Class Rank',
    sectionRank: 'Section Rank',
    zonalRank: 'Zonal/City Rank',
    nationalRank: 'National Rank',
    internationalRank: 'International Rank'
  };

  // Fetch schools for filter dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/schools-filter`);
        if (res.data.success) {
          const schoolOpts = [
            { value: 'all', label: 'All Schools' },
            ...res.data.schools.map(s => ({
              value: String(s.schoolCode),
              label: `${s.schoolName} (${s.schoolCode})`
            }))
          ];
          setSchools(schoolOpts);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };
    fetchSchools();
  }, []);

  // Default topic/rank state
  const defaultTopicNames = {
    section1: 'Section 1',
    section2: 'Section 2',
    section3: 'Section 3',
    section4: 'Section 4',
    section5: 'Section 5'
  };

  const defaultRankVisibility = {
    schoolRank: true,
    zonalRank: true,
    nationalRank: true,
    internationalRank: true,
    classRank: true,
    sectionRank: true
  };

  // Fetch config for subject (tries universal first, falls back to any class-level config)
  const fetchConfig = async (subjectValue) => {
    if (!subjectValue) return;
    try {
      const res = await axios.get(`${BASE_URL}/result-config`, {
        params: { subject: subjectValue, classLevel: 'all' }
      });
      if (res.data.success && res.data.config) {
        setCurrentConfig(res.data.config);
        setTopicNames(res.data.config.topicNames || defaultTopicNames);
        setRankVisibility(res.data.config.rankVisibility || defaultRankVisibility);
        setHasExamConfig(true);
        setShowConfigWarning(false);
      } else {
        // No config found - reset to defaults
        setCurrentConfig(null);
        setTopicNames(defaultTopicNames);
        setRankVisibility(defaultRankVisibility);
        setHasExamConfig(false);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  // Fetch config when subject changes
  useEffect(() => {
    if (selectedSubject?.value) {
      fetchConfig(selectedSubject.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  // Save configuration
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await axios.post(`${BASE_URL}/result-config`, {
        subject: selectedSubject?.value,
        classLevel: 'all',
        topicNames,
        rankVisibility
      });
      if (res.data.success) {
        setCurrentConfig(res.data.config);
        alert("Configuration saved successfully!");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Publish/Unpublish results
  const handlePublish = async (publish = true) => {
    setIsPublishing(true);
    try {
      const res = await axios.post(`${BASE_URL}/publish-results`, {
        subject: selectedSubject?.value,
        classLevel: 'all',
        publish
      });
      if (res.data.success) {
        setCurrentConfig(res.data.config);
        alert(publish ? "Results published to students!" : "Results unpublished.");
      }
    } catch (error) {
      console.error("Error publishing results:", error);
      alert("Failed to publish/unpublish results.");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleRank = (rankKey) => {
    setRankVisibility(prev => ({
      ...prev,
      [rankKey]: !prev[rankKey]
    }));
  };

  // Fetch results
  const fetchResults = async (page = 1) => {
    if (!selectedSubject) {
      alert("Please select a subject/exam first!");
      return;
    }

    setIsLoading(true);
    setFetchMessage(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        subject: selectedSubject?.value || '',
        sortBy: sortBy?.value || 'total.score',
        sortOrder: sortOrder?.value || 'desc',
      });

      if (selectedSchool && selectedSchool.value !== 'all') {
        params.append('schoolCode', selectedSchool.value);
      }
      if (selectedClass && selectedClass.value !== 'all') {
        params.append('studentClass', selectedClass.value);
      }
      if (selectedSection && selectedSection.value !== 'all') {
        params.append('section', selectedSection.value);
      }
      if (searchRollNo.trim()) {
        params.append('rollNo', searchRollNo.trim());
      }

      const res = await axios.get(`${BASE_URL}/view-results?${params.toString()}`);
      
      if (res.data.success) {
        // Check for no admit cards warning
        if (res.data.noAdmitCards) {
          setResults([]);
          setTotalCount(0);
          setTotalPages(1);
          setShowConfigPanel(false);
          setFetchMessage({ type: 'warning', text: res.data.message || 'No admit cards have been generated yet. Please generate admit cards first before viewing or uploading results.' });
          setIsLoading(false);
          return;
        }

        setFetchMessage(null);

        setResults(res.data.data);
        setCurrentPage(res.data.pagination.currentPage);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.totalCount);
        setShowConfigPanel(true);
        
        // Check if exam config exists from response
        if (res.data.hasExamConfig === false) {
          setHasExamConfig(false);
          setShowConfigWarning(true);
        } else {
          setHasExamConfig(true);
          setShowConfigWarning(false);
        }
        
        // Update config from response if available
        if (res.data.examConfig) {
          setCurrentConfig(prev => ({
            ...prev,
            ...res.data.examConfig
          }));
          if (res.data.examConfig.topicNames) {
            setTopicNames(res.data.examConfig.topicNames);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch results. Please try again.';
      setFetchMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    if (!selectedSubject) {
      alert("Please select a subject/exam first!");
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        subject: selectedSubject?.value || '',
        sortBy: sortBy?.value || 'total.score',
        sortOrder: sortOrder?.value || 'desc',
      });

      if (selectedSchool && selectedSchool.value !== 'all') {
        params.append('schoolCode', selectedSchool.value);
      }
      if (selectedClass && selectedClass.value !== 'all') {
        params.append('studentClass', selectedClass.value);
      }
      if (selectedSection && selectedSection.value !== 'all') {
        params.append('section', selectedSection.value);
      }
      if (searchRollNo.trim()) {
        params.append('rollNo', searchRollNo.trim());
      }

      const res = await axios.get(`${BASE_URL}/export-results?${params.toString()}`, {
        responseType: 'blob'
      });

      // Download file
      const blob = new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Results_Export_${selectedSubject?.value}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting results:", error);
      alert("Failed to export results. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchResults(1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchResults(newPage);
    }
  };

  // Reset filters
  const handleReset = () => {
    setSelectedSchool(null);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    setSearchRollNo("");
    setSortBy({ value: 'total.score', label: 'Score' });
    setSortOrder({ value: 'desc', label: 'High to Low' });
    setResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalCount(0);
    setCurrentConfig(null);
    setShowConfigPanel(false);
    setHasExamConfig(true);
    setShowConfigWarning(false);
  };

  // View single student result
  const handleViewResult = async (result) => {
    // Block viewing if no exam config exists
    if (!hasExamConfig) {
      alert("⚠️ Cannot view result: Exam configuration is required.\n\nPlease go to Exam Management to configure topics for this exam first.");
      return;
    }
    
    setIsLoadingResult(true);
    try {
      const res = await axios.get(`${BASE_URL}/single-result`, {
        params: {
          rollNo: result.rollNo,
          subject: selectedSubject?.value
        }
      });
      if (res.data.success) {
        setSelectedResult(res.data.data);
        setShowResultModal(true);
      } else {
        alert("Failed to fetch student result.");
      }
    } catch (error) {
      console.error("Error fetching single result:", error);
      alert("Failed to fetch student result. Please try again.");
    } finally {
      setIsLoadingResult(false);
    }
  };

  // Get rating color
  const getRatingColor = (rating) => {
    const colors = {
      'EXCELLENT': 'bg-green-500 text-white',
      'GOOD': 'bg-blue-500 text-white',
      'AVERAGE': 'bg-yellow-500 text-white',
      'IMPROVE': 'bg-orange-500 text-white',
      'BAD': 'bg-red-500 text-white'
    };
    return colors[rating] || 'bg-gray-400 text-white';
  };

  // Get rating based on percentage
  const getRating = (percentage) => {
    if (percentage >= 80) return 'EXCELLENT';
    if (percentage >= 70) return 'GOOD';
    if (percentage >= 60) return 'AVERAGE';
    if (percentage >= 45) return 'IMPROVE';
    return 'BAD';
  };

  // Demo result data for preview
  const demoResult = results.length > 0 ? results[0] : null;

  // Custom select styles matching theme
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      borderColor: '#e5e7eb',
      '&:hover': { borderColor: '#3b82f6' },
      boxShadow: 'none',
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
      color: isSelected ? 'white' : '#374151',
    }),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Eye className="text-blue-600" size={32} />
          View Results
        </h1>
        <p className="text-gray-600 mt-1">
          View, configure and publish student results
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <Filter className="text-blue-600" size={20} />
            <span className="font-semibold text-gray-800">Filters</span>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {showFilters && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject/Exam <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                  options={subjectOptions}
                  placeholder="Select Subject..."
                  styles={selectStyles}
                  isClearable
                />
              </div>

              {/* School Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <Select
                  value={selectedSchool}
                  onChange={setSelectedSchool}
                  options={schools}
                  placeholder="All Schools"
                  styles={selectStyles}
                  isClearable
                />
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <Select
                  value={selectedClass}
                  onChange={setSelectedClass}
                  options={classOptions}
                  placeholder="All Classes"
                  styles={selectStyles}
                  isClearable
                />
              </div>

              {/* Section Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <Select
                  value={selectedSection}
                  onChange={setSelectedSection}
                  options={sectionOptions}
                  placeholder="All Sections"
                  styles={selectStyles}
                  isClearable
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  styles={selectStyles}
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <Select
                  value={sortOrder}
                  onChange={setSortOrder}
                  options={sortOrderOptions}
                  styles={selectStyles}
                />
              </div>

              {/* Roll No Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search by Roll No</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchRollNo}
                    onChange={(e) => setSearchRollNo(e.target.value)}
                    placeholder="Enter roll number..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSearch}
                disabled={isLoading || !selectedSubject}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Search size={18} />
                {isLoading ? 'Loading...' : 'Search Results'}
              </button>

              <button
                onClick={handleExport}
                disabled={isExporting || results.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <RefreshCw size={18} />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {totalCount > 0 && (
        <div className={`border rounded-lg px-4 py-3 mb-4 flex items-center justify-between ${
          currentConfig?.isPublished 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={currentConfig?.isPublished ? 'text-green-800' : 'text-blue-800'}>
            Showing <strong>{results.length}</strong> of <strong>{totalCount}</strong> results
            {selectedSubject && <span> for <strong>{selectedSubject.label}</strong></span>}
          </p>
          {currentConfig?.isPublished ? (
            <span className="flex items-center gap-2 text-green-700 font-medium text-sm">
              <Check size={16} />
              Results Published to Students
            </span>
          ) : (
            <span className="flex items-center gap-2 text-yellow-700 font-medium text-sm">
              <EyeOff size={16} />
              Results Not Published
            </span>
          )}
        </div>
      )}

      {/* Exam Config Warning */}
      {showConfigWarning && !hasExamConfig && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">
                ⚠️ Exam Configuration Required
              </h3>
              <p className="text-red-700 mb-4">
                No exam configuration found for <strong>{selectedSubject?.label}</strong>. 
                You must configure the exam topics before students can view their results properly.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/ExamManagement"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium"
                >
                  <Settings size={18} />
                  Configure Exam Now
                </a>
                <button
                  onClick={() => setShowConfigWarning(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <X size={18} />
                  Dismiss
                </button>
              </div>
              <p className="text-sm text-red-600 mt-3">
                <strong>Note:</strong> Without exam config, topic names will show as "Section 1", "Section 2", etc. 
                Configure topics in Exam Management to show proper names like "ALGEBRA", "GEOMETRY", etc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result Configuration & Preview Panel - Shows after search */}
      {showConfigPanel && selectedSubject && results.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Settings className="text-purple-600" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Result Card Configuration & Preview</h3>
                <p className="text-sm text-gray-500">Configure how results appear to students for {selectedSubject?.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Publish Status Badge */}
              {currentConfig?.isPublished ? (
                <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-2">
                  <Check size={16} />
                  Published
                </span>
              ) : (
                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full flex items-center gap-2">
                  <EyeOff size={16} />
                  Not Published
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Configuration */}
              <div className="space-y-6">
                {/* Topic Names Configuration */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Target size={16} className="text-blue-500" />
                    Topic Names for SPR (Subject Performance Report)
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(topicNames).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <label className="w-24 text-xs text-gray-500 font-medium">
                          {key.replace('section', 'Section ')}:
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setTopicNames(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder={`Enter topic name`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rank Visibility Configuration */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500" />
                    Rank Display Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(rankLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleRank(key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                          rankVisibility[key]
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {rankVisibility[key] ? (
                          <Eye size={14} className="text-purple-500" />
                        ) : (
                          <EyeOff size={14} className="text-gray-400" />
                        )}
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {isSavingConfig ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>

                  {currentConfig?.isPublished ? (
                    <button
                      onClick={() => handlePublish(false)}
                      disabled={isPublishing}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                      {isPublishing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                      {isPublishing ? 'Processing...' : 'Unpublish Results'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(true)}
                      disabled={isPublishing}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                      {isPublishing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      {isPublishing ? 'Publishing...' : 'Publish to Students'}
                    </button>
                  )}
                </div>

                {/* Publish Info */}
                <div className={`p-3 rounded-lg text-sm ${currentConfig?.isPublished ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={currentConfig?.isPublished ? 'text-green-700' : 'text-yellow-700'}>
                    {currentConfig?.isPublished ? (
                      <>
                        <strong>✓ Published:</strong> Students can view their results for {selectedSubject?.label}. 
                        {currentConfig?.publishedAt && ` Published on: ${new Date(currentConfig.publishedAt).toLocaleString()}`}
                      </>
                    ) : (
                      <>
                        <strong>⚠ Not Published:</strong> Students cannot see results yet. Save configuration and click "Publish to Students" when ready.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Right Column - Demo Preview (Matches PDF Design) */}
              <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <FileText size={16} className="text-gray-600" />
                  Result Card Preview (Demo)
                </h4>
                
                {demoResult ? (
                  <div className="bg-white border-2 border-black overflow-hidden text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
                      <div>
                        <h1 className="text-base font-bold text-black uppercase tracking-wide">
                          {selectedSubject?.label || 'EXAM NAME'}
                        </h1>
                        <p className="text-xs font-semibold text-gray-600">BASIC LEVEL RESULT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">IQ NEXUS</p>
                      </div>
                    </div>

                    <div className="p-3">
                      {/* Student Details Table */}
                      <table className="w-full mb-3 border-collapse text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100 w-1/4">STUDENT</td>
                            <td className="border border-black px-2 py-1 uppercase">{demoResult.studentName || 'N/A'}</td>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100 w-1/4">ROLL NO</td>
                            <td className="border border-black px-2 py-1">{demoResult.rollNo}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100">CLASS</td>
                            <td className="border border-black px-2 py-1">{demoResult.studentClass}</td>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100">SECTION</td>
                            <td className="border border-black px-2 py-1">{demoResult.section}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100">MARKS</td>
                            <td className="border border-black px-2 py-1 font-bold">{demoResult.score ?? 0} / 100</td>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100">PERCENTAGE</td>
                            <td className="border border-black px-2 py-1 font-bold">{demoResult.percentage?.toFixed(1) || 0}%</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-1 font-semibold bg-gray-100">RATING</td>
                            <td className="border border-black px-2 py-1 font-bold" colSpan="3">
                              {getRating(demoResult.percentage || 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Rankings */}
                      <div className="mb-3">
                        <p className="text-xs font-bold text-black uppercase mb-1 border-b border-black pb-1">RANKINGS</p>
                        <div className="grid grid-cols-6 gap-1 text-xs">
                          {rankVisibility.schoolRank && (
                            <div className="border border-black p-1 text-center">
                              <p className="text-[10px] text-gray-600">SCHOOL</p>
                              <p className="text-sm font-bold">{demoResult.schoolRank > 0 ? demoResult.schoolRank : '-'}</p>
                            </div>
                          )}
                          {rankVisibility.classRank && (
                            <div className="border border-black p-1 text-center">
                              <p className="text-[10px] text-gray-600">CLASS</p>
                              <p className="text-sm font-bold">{demoResult.classRank > 0 ? demoResult.classRank : '-'}</p>
                            </div>
                          )}
                          {rankVisibility.sectionRank && (
                            <div className="border border-black p-1 text-center">
                              <p className="text-[10px] text-gray-600">SECTION</p>
                              <p className="text-sm font-bold">{demoResult.sectionRank > 0 ? demoResult.sectionRank : '-'}</p>
                            </div>
                          )}
                          {rankVisibility.zonalRank && (
                            <div className="border border-black p-1 text-center">
                              <p className="text-[10px] text-gray-600">ZONAL</p>
                              <p className="text-sm font-bold">{demoResult.cityRank > 0 ? demoResult.cityRank : '-'}</p>
                            </div>
                          )}
                          {rankVisibility.nationalRank && (
                            <div className="border border-black p-1 text-center">
                              <p className="text-[10px] text-gray-600">NAT'L</p>
                              <p className="text-sm font-bold">{demoResult.nationalRank > 0 ? demoResult.nationalRank : '-'}</p>
                            </div>
                          )}
                          {rankVisibility.internationalRank && (
                            <div className="border border-black p-1 text-center">
                              <p className="text-[10px] text-gray-600">INT'L</p>
                              <p className="text-sm font-bold">{demoResult.internationalRank > 0 ? demoResult.internationalRank : '-'}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subject Performance Report (SPR) */}
                      <div className="mb-2">
                        <p className="text-xs font-bold text-black uppercase mb-1 border-b border-black pb-1">
                          SUBJECT PERFORMANCE REPORT (SPR)
                        </p>
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border border-black px-1 py-1 text-left font-bold text-[10px]">TOPIC</th>
                              <th className="border border-black px-1 py-1 text-center font-bold text-[10px]">RATING</th>
                              <th className="border border-black px-1 py-1 text-center font-bold text-[10px]">AI CHART</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(topicNames).map(([key, name], index) => {
                              if (!name || name.trim() === '') return null;
                              const sampleRatings = ['EXCELLENT', 'GOOD', 'AVERAGE', 'IMPROVE', 'BAD'];
                              const sampleRating = sampleRatings[index % sampleRatings.length];
                              const getRatingClass = (rating) => {
                                const classes = {
                                  'EXCELLENT': 'text-green-600',
                                  'GOOD': 'text-blue-600',
                                  'AVERAGE': 'text-yellow-600',
                                  'IMPROVE': 'text-orange-600',
                                  'BAD': 'text-red-600'
                                };
                                return classes[rating] || 'text-gray-600';
                              };
                              return (
                                <tr key={key}>
                                  <td className="border border-black px-1 py-1 font-medium text-[10px]">
                                    {index + 1}. {name.toUpperCase()}
                                  </td>
                                  <td className={`border border-black px-1 py-1 text-center font-bold text-[10px] ${getRatingClass(sampleRating)}`}>
                                    {sampleRating}
                                  </td>
                                  <td className="border border-black px-1 py-1 text-center text-gray-600 text-[10px]">
                                    {sampleRating === 'EXCELLENT' ? '80-100%' : sampleRating === 'GOOD' ? '70-80%' : sampleRating === 'AVERAGE' ? '60-70%' : sampleRating === 'IMPROVE' ? '45-60%' : '0-45%'}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Total Row */}
                            <tr className="bg-gray-100 font-bold">
                              <td className="border border-black px-1 py-1 text-[10px]">TOTAL</td>
                              <td className="border border-black px-1 py-1 text-center text-[10px]">
                                {getRating(demoResult.percentage || 0)}
                              </td>
                              <td className="border border-black px-1 py-1 text-center text-gray-600 text-[10px]">
                                {demoResult.percentage >= 80 ? '80-100%' : demoResult.percentage >= 70 ? '70-80%' : demoResult.percentage >= 60 ? '60-70%' : demoResult.percentage >= 45 ? '45-60%' : '0-45%'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Footer */}
                      <div className="pt-2 border-t border-black text-center text-[9px] text-gray-500">
                        <p>© {new Date().getFullYear()} IQ NEXUS</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No results to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-4 py-3 text-center font-semibold bg-blue-800">ACTION</th>
                <th className="px-4 py-3 text-center font-semibold">
                  {currentConfig?.isPublished ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check size={14} className="text-green-300" />
                      PUBLISHED
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <EyeOff size={14} className="text-yellow-300" />
                      DRAFT
                    </span>
                  )}
                </th>
                <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold">Roll No</th>
                <th className="px-4 py-3 text-left font-semibold">School</th>
                <th className="px-4 py-3 text-center font-semibold">Class</th>
                <th className="px-4 py-3 text-center font-semibold">Section</th>
                <th className="px-4 py-3 text-center font-semibold bg-green-600">SCORE</th>
                <th className="px-4 py-3 text-center font-semibold bg-green-600">%</th>
                <th className="px-4 py-3 text-center font-semibold bg-purple-600">INT'L RANK</th>
                <th className="px-4 py-3 text-center font-semibold bg-purple-600">NAT'L RANK</th>
                <th className="px-4 py-3 text-center font-semibold bg-orange-600">CITY RANK</th>
                <th className="px-4 py-3 text-center font-semibold bg-orange-600">SCHOOL RANK</th>
                <th className="px-4 py-3 text-center font-semibold bg-orange-600">CLASS RANK</th>
                <th className="px-4 py-3 text-center font-semibold bg-orange-600">SECTION RANK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      Loading results...
                    </div>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      {fetchMessage ? (
                        <>
                          <AlertCircle size={48} className={fetchMessage.type === 'error' ? 'text-red-400' : 'text-yellow-400'} />
                          <p className={`text-lg font-medium ${
                            fetchMessage.type === 'error' ? 'text-red-600' : 'text-yellow-700'
                          }`}>
                            {fetchMessage.type === 'error' ? 'Error' : 'Action Required'}
                          </p>
                          <span className={`text-sm max-w-md px-4 py-2 rounded-lg ${
                            fetchMessage.type === 'error' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}>
                            {fetchMessage.text}
                          </span>
                        </>
                      ) : (
                        <>
                          <Eye size={48} className="text-gray-300" />
                          <p className="text-lg font-medium">No results found</p>
                          <p className="text-sm">Select a subject and click "Search Results" to view data</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((result, index) => (
                  <tr 
                    key={`${result.rollNo}-${index}`}
                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewResult(result)}
                        disabled={isLoadingResult || !hasExamConfig}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium mx-auto ${
                          hasExamConfig 
                            ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400" 
                            : "bg-red-100 text-red-600 cursor-not-allowed"
                        }`}
                        title={hasExamConfig ? "View detailed result" : "Configure exam first to view results"}
                      >
                        <FileText size={14} />
                        {hasExamConfig ? "View" : "No Config"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {currentConfig?.isPublished ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✓ Live
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {result.studentName || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{result.rollNo || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate" title={result.schoolName}>
                      {result.schoolName || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{result.studentClass || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{result.section || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg font-bold">
                        {result.score ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-green-700">
                      {result.percentage?.toFixed(1) || 0}%
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-purple-700">
                      {result.internationalRank > 0 ? result.internationalRank : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-purple-700">
                      {result.nationalRank > 0 ? result.nationalRank : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-orange-700">
                      {result.cityRank > 0 ? result.cityRank : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-orange-700">
                      {result.schoolRank > 0 ? result.schoolRank : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-orange-700">
                      {result.classRank > 0 ? result.classRank : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-orange-700">
                      {result.sectionRank > 0 ? result.sectionRank : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Result Card Modal */}
      <ResultCardModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setSelectedResult(null);
        }}
        result={selectedResult}
        config={currentConfig}
      />
    </div>
  );
};

export default ViewResults;
