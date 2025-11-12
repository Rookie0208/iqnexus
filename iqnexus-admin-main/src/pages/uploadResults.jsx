import React, { useState } from "react";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Download,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../Api";

// Exam field mapping and exam codes for levels
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

const examLevelOptions = [
    { value: "L1", label: "Basic" },
    { value: "L2", label: "Advance" },
];

const classOptions = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];

// Example qualifiedlist structure (replace with your actual data source)
const qualifiedlist = {
    L1: [
        { value: "IQMOL1", label: "IQMOL1" },
        { value: "IQSOL1", label: "IQSOL1" },
        { value: "IQEOL1", label: "IQEOL1" },
        { value: "IQROL1", label: "IQROL1" },
        { value: "IQGKOL1", label: "IQGKOL1" },
    ],
    L2: [
        { value: "IQMOL2", label: "IQMOL2" },
        { value: "IQSOL2", label: "IQSOL2" },
        { value: "IQEOL2", label: "IQEOL2" },
        { value: "IQROL2", label: "IQROL2" },
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

    // Get subject options based on selected exam level
    const subjectOptions = examLevel ? qualifiedlist[examLevel] || [] : [];

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

    const handleUpload = async () => {
        if (!file || !subject || !studentClass || !schoolCode || !examLevel) {
            setUploadStatus({
                type: "error",
                message: "Please fill all fields and select a file.",
            });
            return;
        }

        setUploadStatus({ type: "loading", message: "Uploading..." });

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("subject", subject);
            formData.append("studentClass", studentClass);
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
                    message: "Results uploaded successfully!",
                });
                setFile(null);
                setSubject("");
                setStudentClass("");
                setSchoolCode("");
                setExamLevel("");
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            setUploadStatus({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to upload results.",
            });
        }
    };

    return (
        <div className="max-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Bulk Result Upload
                    </h1>
                    <p className="text-gray-600">
                        Upload student results using the official template.
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
                            <input
                                type="number"
                                placeholder="School Code"
                                value={schoolCode}
                                onChange={(e) => setSchoolCode(e.target.value.replace(/\D/, ""))}
                                className="w-full border rounded-lg px-3 py-2"
                                min="0"
                            />
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
                                !studentClass ||
                                !schoolCode ||
                                !examLevel ||
                                uploadStatus?.type === "loading"
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
                        <h2 className="text-lg font-semibold text-gray-800">
                            File Guidelines
                        </h2>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <div className="min-w-4 mt-1">•</div>
                                <p>
                                    CSV or Excel file (.csv, .xlsx, .xls) with UTF-8 encoding is required.
                                </p>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="min-w-4 mt-1">•</div>
                                <p>
                                    Required columns: <strong>roll no</strong>,{" "}
                                    <strong>marks obtained</strong>, <strong>total marks</strong>,{" "}
                                    <strong>pass or fail</strong>
                                </p>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="min-w-4 mt-1">•</div>
                                <p>Max file size: 10MB</p>
                            </li>
                        </ul>

                        <div className="pt-4 border-t border-gray-200">
                            <a
                                href="/resultTemplate.xlsx"
                                className="hover:cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                download
                            >
                                <Download className="w-4 h-4" />
                                Download Result Template
                            </a>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 mt-6">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">
                                Need Help?
                            </h3>
                            <p className="text-sm text-blue-600">
                                If you need assistance with the upload process or have questions
                                about the required format, please contact our support team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Uploadresults;
