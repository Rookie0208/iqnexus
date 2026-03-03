import React, { useState, useEffect } from "react";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Download,
    Info,
    BookOpen,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../Api";

const examLevelOptions = [
    { value: "L1", label: "Basic" },
    { value: "L2", label: "Advance" },
    { value: "KG", label: "Kindergarten" },
];

const classOptions = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];

// Example qualifiedlist structure (replace with your actual data source)
const qualifiedlist = {
    L1: [
        { value: "IQMOL1", label: "IQMOL1 - Maths Olympiad" },
        { value: "IQSOL1", label: "IQSOL1 - Science Olympiad" },
        { value: "IQEOL1", label: "IQEOL1 - English Olympiad" },
        { value: "IQROL1", label: "IQROL1 - Reasoning Olympiad" },
        { value: "IQGKOL1", label: "IQGKOL1 - GK Olympiad" },
    ],
    L2: [
        { value: "IQMOL2", label: "IQMOL2 - Maths Olympiad" },
        { value: "IQSOL2", label: "IQSOL2 - Science Olympiad" },
        { value: "IQEOL2", label: "IQEOL2 - English Olympiad" },
        { value: "IQROL2", label: "IQROL2 - Reasoning Olympiad" },
    ],
    KG: [
        { value: "IQKD1", label: "IQKD1 - Kindergarten Exam 1" },
        { value: "IQKD2", label: "IQKD2 - Kindergarten Exam 2" },
    ],
};

const Uploadresults = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [subject, setSubject] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [examLevel, setExamLevel] = useState("");
    const [uploadSummary, setUploadSummary] = useState(null);
    const [examConfig, setExamConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    // Get subject options based on selected exam level
    const subjectOptions = examLevel ? qualifiedlist[examLevel] || [] : [];

    // Fetch exam config when subject changes
    useEffect(() => {
        const fetchExamConfig = async () => {
            if (!subject) {
                setExamConfig(null);
                return;
            }
            setLoadingConfig(true);
            try {
                const res = await axios.get(`${BASE_URL}/result-config`, {
                    params: { subject, classLevel: 'all' }
                });
                if (res.data.success && res.data.config) {
                    setExamConfig(res.data.config);
                }
            } catch (error) {
                console.error("Error fetching exam config:", error);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchExamConfig();
    }, [subject]);

    // Validate school + students exist when schoolCode and class are set
    useEffect(() => {
        const validateSchoolAndStudents = async () => {
            if (!schoolCode || (!studentClass && examLevel !== "KG")) {
                setValidationStatus(null);
                return;
            }
            setIsValidating(true);
            try {
                // Check school exists
                const schoolRes = await axios.get(`${BASE_URL}/get-school/${schoolCode}`);
                
                if (!schoolRes.data?.school) {
                    setValidationStatus({
                        type: "error",
                        message: `School with code ${schoolCode} does not exist. Please add the school first.`
                    });
                    setIsValidating(false);
                    return;
                }

                const schoolName = schoolRes.data.school.schoolName || '';

                if (examLevel === "KG") {
                    // Check KG students exist for this school
                    const kgRes = await axios.post(`${BASE_URL}/kindergarten-students`, {
                        schoolCode,
                    });
                    const kgCount = kgRes.data?.totalStudents || kgRes.data?.data?.length || 0;
                    
                    if (kgCount === 0) {
                        setValidationStatus({
                            type: "error",
                            message: `No kindergarten students found for ${schoolName} (${schoolCode}). Upload KG student data first.`
                        });
                    } else {
                        setValidationStatus({
                            type: "success",
                            message: `✓ ${kgCount} kindergarten students found for ${schoolName} (${schoolCode})`
                        });
                    }
                } else {
                    // Check regular students exist for this school + class
                    const studentRes = await axios.post(`${BASE_URL}/all-students-no-pagination`, {
                        schoolCode,
                        className: [studentClass],
                    });
                    const studentCount = studentRes.data?.totalStudents || 0;
                    
                    if (studentCount === 0) {
                        setValidationStatus({
                            type: "error",
                            message: `No students found for ${schoolName} (${schoolCode}) in class ${studentClass}. Upload student data first.`
                        });
                    } else {
                        setValidationStatus({
                            type: "success",
                            message: `✓ ${studentCount} students found for ${schoolName} (${schoolCode}), class ${studentClass}`
                        });
                    }
                }
            } catch (error) {
                setValidationStatus({
                    type: "error",
                    message: `Could not verify school/student data: ${error.response?.data?.message || error.message}`
                });
            } finally {
                setIsValidating(false);
            }
        };

        // Debounce to avoid too many requests
        const timer = setTimeout(validateSchoolAndStudents, 500);
        return () => clearTimeout(timer);
    }, [schoolCode, studentClass, examLevel]);

    // Get topic count from config
    const getTopicCount = () => {
        if (!examConfig?.topicNames) return 5;
        const count = Object.values(examConfig.topicNames).filter(name => name && name.trim() !== "" && name !== `Section ${Object.keys(examConfig.topicNames).indexOf(name) + 1}`).length;
        return count || 5;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (
            selectedFile &&
            (selectedFile.type === "text/csv" ||
                selectedFile.type ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                selectedFile.type === "application/vnd.ms-excel" ||
                selectedFile.name.endsWith(".csv") ||
                selectedFile.name.endsWith(".xlsx") ||
                selectedFile.name.endsWith(".xls"))
        ) {
            setFile(selectedFile);
            setUploadStatus(null);
            setUploadSummary(null);
        } else {
            setUploadStatus({
                type: "error",
                message: "Please select a valid CSV or Excel file.",
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (
            droppedFile &&
            (droppedFile.type === "text/csv" ||
                droppedFile.type ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                droppedFile.type === "application/vnd.ms-excel" ||
                droppedFile.name.endsWith(".csv") ||
                droppedFile.name.endsWith(".xlsx") ||
                droppedFile.name.endsWith(".xls"))
        ) {
            setFile(droppedFile);
            setUploadStatus(null);
            setUploadSummary(null);
        } else {
            setUploadStatus({
                type: "error",
                message: "Please drop a valid CSV or Excel file.",
            });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/download-result-template`, {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Result_Upload_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading template:', error);
            setUploadStatus({
                type: "error",
                message: "Failed to download template. Please try again.",
            });
        }
    };

    const handleUpload = async () => {
        const isKG = examLevel === "KG";
        const effectiveClass = isKG ? "KD" : studentClass;
        
        if (!file || !subject || (!effectiveClass) || !schoolCode || !examLevel) {
            setUploadStatus({
                type: "error",
                message: "Please fill all fields and select a file.",
            });
            return;
        }

        setUploadStatus({ type: "loading", message: "Uploading..." });
        setUploadSummary(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("subject", subject);
            formData.append("studentClass", effectiveClass);
            formData.append("schoolCode", schoolCode);
            formData.append("examLevel", examLevel);

            const response = await axios.post(
                `${BASE_URL}/upload-result`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.status === 200) {
                setUploadStatus({
                    type: "success",
                    message: response.data.message || "Results uploaded successfully!",
                });
                
                // Show upload summary if available
                if (response.data.summary) {
                    setUploadSummary(response.data.summary);
                }
                
                setFile(null);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            setUploadStatus({
                type: "error",
                message:
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Failed to upload results.",
            });
        }
    };

    return (
        <div className="max-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl w-full mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Bulk Result Upload
                    </h1>
                    <p className="text-gray-600">
                        Upload student results for Classes 1-12 and Kindergarten using the official template.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Upload Card */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <select
                                value={examLevel}
                                onChange={(e) => {
                                    setExamLevel(e.target.value);
                                    setSubject(""); // Reset subject when exam level changes
                                    if (e.target.value === "KG") {
                                        setStudentClass("KD"); // Auto-set class for KG
                                    } else {
                                        setStudentClass(""); // Reset class for non-KG
                                    }
                                }}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select Exam Level</option>
                                {examLevelOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                disabled={!examLevel}
                            >
                                <option value="">Select Subject</option>
                                {subjectOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {examLevel === "KG" ? (
                                <div className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                                    Kindergarten (KD) — LKG / UKG / PG
                                </div>
                            ) : (
                            <select
                                value={studentClass}
                                onChange={(e) => setStudentClass(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select Class</option>
                                {classOptions.map((cls) => (
                                    <option key={cls} value={cls}>
                                        {cls}
                                    </option>
                                ))}
                            </select>
                            )}
                            <input
                                type="number"
                                placeholder="School Code"
                                value={schoolCode}
                                onChange={(e) => setSchoolCode(e.target.value.replace(/\D/, ""))}
                                className="w-full border rounded-lg px-3 py-2"
                                min="0"
                            />

                            {/* Validation Status */}
                            {isValidating && (
                                <div className="p-3 rounded-lg text-sm bg-blue-50 text-blue-700 flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                                    Verifying school and student data...
                                </div>
                            )}
                            {!isValidating && validationStatus && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                                    validationStatus.type === "success"
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                    {validationStatus.type === "success" ? (
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    {validationStatus.message}
                                </div>
                            )}
                        </div>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                                isDragging
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300 hover:border-gray-400"
                            }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="fileInput"
                            />
                            <label htmlFor="fileInput" className="cursor-pointer block">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <p className="mt-2 text-sm text-gray-600">
                                    {file ? (
                                        <span className="font-medium text-gray-800">
                                            {file.name}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="font-medium text-blue-600">
                                                Click to upload
                                            </span>{" "}
                                            or drag and drop
                                        </>
                                    )}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Only .csv, .xlsx, .xls files allowed
                                </p>
                            </label>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={
                                !file ||
                                !subject ||
                                (!studentClass && examLevel !== "KG") ||
                                !schoolCode ||
                                !examLevel ||
                                uploadStatus?.type === "loading" ||
                                isValidating ||
                                validationStatus?.type === "error"
                            }
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            {uploadStatus?.type === "loading" ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="w-5 h-5" />
                                    Upload Results
                                </>
                            )}
                        </button>

                        {uploadStatus && (
                            <div
                                className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
                                    uploadStatus.type === "success"
                                        ? "bg-green-100 text-green-800"
                                        : uploadStatus.type === "error"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                            >
                                {uploadStatus.type === "success" ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                {uploadStatus.message}
                            </div>
                        )}
                    </div>

                    {/* File Requirement Info */}
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            Template Format {examLevel === "KG" ? "(Kindergarten)" : "(Classes 1-12)"}
                        </h2>

                        {/* Exam Config Preview */}
                        {subject && examConfig && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Configured Topics for {subject}
                                </h3>
                                <div className="grid grid-cols-1 gap-1 text-sm text-purple-700">
                                    {examConfig.topicNames && Object.entries(examConfig.topicNames).map(([key, name], index) => (
                                        name && name.trim() !== "" && (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="font-medium">Section {index + 1}:</span>
                                                <span className="text-purple-900">{name}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                                <p className="text-xs text-purple-600 mt-2">
                                    <a href="/ExamManagement" className="underline hover:text-purple-800">
                                        Edit topic names in Exam Management →
                                    </a>
                                </p>
                            </div>
                        )}
                        
                        <div className="space-y-3 text-sm text-gray-600">
                            <p className="font-medium text-gray-700">Required Columns:</p>
                            <div className="bg-white rounded-lg p-3 border text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="font-semibold text-blue-600">Basic Info:</span>
                                        <ul className="ml-2 mt-1 space-y-0.5">
                                            <li>• ROLL NO</li>
                                            <li>• ATTENDANCE</li>
                                            <li>• CLASS</li>
                                            <li>• SECTION</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-green-600">Sections 1-5:</span>
                                        <ul className="ml-2 mt-1 space-y-0.5">
                                            <li>• S{"{n}"}_Score</li>
                                            <li>• S{"{n}"}_Percentage</li>
                                            <li>• S{"{n}"}_CorrectQCount</li>
                                            <li>• S{"{n}"}_TotalQCount</li>
                                            <li>• S{"{n}"}_UnAttempted</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t">
                                    <span className="font-semibold text-purple-600">Total:</span>
                                    <span className="ml-2">Total_Score, Total_Rank, Total_Percentage, Total_CorrectQCount, Total_TotalQCount, Total_UnAttempted</span>
                                </div>
                                <div className="mt-2 pt-2 border-t">
                                    <span className="font-semibold text-orange-600">Optional Ranks:</span>
                                    <span className="ml-2">School_Rank, Class_Rank, Section_Rank, City_Rank, National_Rank, International_Rank</span>
                                </div>
                            </div>
                            
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-yellow-800 text-xs">
                                    <strong>ATTENDANCE Values:</strong> PRESENT | ABSENT | DISQUALIFIED
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                            >
                                <Download className="w-4 h-4" />
                                Download Result Template
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                                XLSX format with sample data and instructions
                            </p>
                        </div>

                        {/* Upload Summary */}
                        {uploadSummary && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <h3 className="text-sm font-medium text-blue-800 mb-2">
                                    Upload Summary
                                </h3>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <p>Total Processed: <strong>{uploadSummary.totalProcessed}</strong></p>
                                    <p>Success: <strong className="text-green-600">{uploadSummary.successCount}</strong></p>
                                    <p>Errors: <strong className="text-red-600">{uploadSummary.errorCount}</strong></p>
                                </div>
                                {uploadSummary.errors && uploadSummary.errors.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                        <p className="text-xs font-medium text-red-600 mb-1">First {uploadSummary.errors.length} errors:</p>
                                        <ul className="text-xs text-red-500 space-y-0.5">
                                            {uploadSummary.errors.slice(0, 5).map((err, idx) => (
                                                <li key={idx}>• {err.rollNo || 'Unknown'}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-blue-50 rounded-lg p-4 mt-4">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">
                                Need Help?
                            </h3>
                            <p className="text-sm text-blue-600">
                                Download the template first. It contains sample data and detailed instructions in the second sheet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Uploadresults;
