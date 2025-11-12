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

const UploadBulkKindergartenStudentData = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setUploadStatus(null);
        } else {
            setUploadStatus({
                type: 'error',
                message: 'Please select a valid CSV file.',
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'text/csv') {
            setFile(droppedFile);
            setUploadStatus(null);
        } else {
            setUploadStatus({
                type: 'error',
                message: 'Please drop a valid CSV file.',
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
        if (!file) {
            setUploadStatus({
                type: 'error',
                message: 'Please select a file first.',
            });
            return;
        }

        setUploadStatus({ type: 'loading', message: 'Uploading...' });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${BASE_URL}/upload-kindergarten-students`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log(response.data);

            if (response.status === 200) {
                setUploadStatus({
                    type: 'success',
                    message: response.data.message || 'Kindergarten student data uploaded successfully!',
                });
                setFile(null);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            let errorMessage = 'Failed to upload student data.';
            if (error.response?.data?.message === 'Please upload a CSV file') {
                errorMessage = 'Please upload a valid CSV file.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                if (error.response.data.errors) {
                    errorMessage += `: ${error.response.data.errors.join(', ')}`;
                } else if (error.response.data.duplicates) {
                    errorMessage += `: Duplicate roll numbers - ${error.response.data.duplicates.join(', ')}`;
                } else if (error.response.data.existing) {
                    errorMessage += `: Existing roll numbers - ${error.response.data.existing.join(', ')}`;
                }
            }
            setUploadStatus({
                type: 'error',
                message: errorMessage,
            });
        }
    };

    return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-teal-50 flex items-center justify-center p-4 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-4xl w-full mx-auto border border-indigo-100/50">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 tracking-tight">
            Kindergarten Bulk Upload
          </h1>
          <p className="mt-1 text-gray-600 text-sm sm:text-base font-medium animate-fade-in">
            Upload student data via CSV template
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Upload Card */}
          <div className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all duration-300 ease-in-out cursor-pointer bg-gradient-to-b from-white to-gray-50/50 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-100/30 scale-105"
                  : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/20"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer block">
                <Upload className="mx-auto h-8 w-8 text-indigo-400 mb-2 transition-transform duration-300 hover:scale-110" />
                <p className="mt-1 text-xs sm:text-sm text-gray-700 font-medium">
                  {file ? (
                    <span className="font-semibold text-indigo-600">{file.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        Upload
                      </span>{" "}
                      or drag and drop
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs text-gray-500">.csv files (max 10MB)</p>
              </label>
              <div className="absolute inset-0 rounded-xl border-2 border-transparent pointer-events-none bg-gradient-to-r from-indigo-50/0 via-indigo-50/10 to-indigo-50/0 animate-pulse" />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploadStatus?.type === "loading"}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-blue-700 disabled:from-indigo-400 disabled:to-blue-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {uploadStatus?.type === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Upload Students
                </>
              )}
            </button>

            {uploadStatus && (
              <div
                className={`p-3 rounded-lg text-xs sm:text-sm flex items-center gap-2 animate-slide-up ${
                  uploadStatus.type === "success"
                    ? "bg-green-100 text-green-900 border border-green-200"
                    : uploadStatus.type === "error"
                    ? "bg-red-100 text-red-900 border border-red-200"
                    : "bg-blue-100 text-blue-900 border border-blue-200"
                }`}
              >
                {uploadStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="flex-1">{uploadStatus.message}</span>
              </div>
            )}
          </div>

          {/* File Requirement Info */}
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-4 sm:p-6 space-y-3 border border-indigo-100/50">
            <h2 className="text-base sm:text-lg font-semibold text-indigo-900">File Guidelines</h2>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-0.5 text-indigo-500">•</div>
                <p>Use UTF-8 encoded CSV.</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-0.5 text-indigo-500">•</div>
                <p>
                  Required: <strong>studentName</strong>, <strong>rollNo</strong>,{" "}
                  <strong>schoolCode</strong>, <strong>section</strong>
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-0.5 text-indigo-500">•</div>
                <p>
                  Optional: <strong>motherName</strong>, <strong>fatherName</strong>,{" "}
                  <strong>dob</strong>, <strong>mobNo</strong>, <strong>city</strong>,{" "}
                  <strong>IQKG</strong>, <strong>Duplicates</strong>
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-0.5 text-indigo-500">•</div>
                <p>Class is fixed as "KG".</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-0.5 text-indigo-500">•</div>
                <p>Max size: 10MB.</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-0.5 text-indigo-500">•</div>
                <p>Unique roll numbers required.</p>
              </li>
            </ul>

            <div className="pt-3 border-t border-indigo-200/50">
              <a
                href="/kgstudentCSV.csv"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-medium transition-colors duration-200 hover:underline"
                download
              >
                <Download className="w-4 h-4" />
               Download CSV Template
              </a>
            </div>

            <div className="bg-indigo-100/50 rounded-lg p-3 mt-3 border border-indigo-200/50">
              <h3 className="text-xs sm:text-sm font-medium text-indigo-900 mb-1">
                Need Help?
              </h3>
              <p className="text-xs text-gray-600">
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

export default UploadBulkKindergartenStudentData;
