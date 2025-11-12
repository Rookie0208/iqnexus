import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";

const UploadBulkSchoolData = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: "error",
        message: "Please select a valid CSV file",
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: "error",
        message: "Please drop a valid CSV file",
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
        type: "error",
        message: "Please select a file first",
      });
      return;
    }

    setUploadStatus({ type: "loading", message: "Uploading..." });

    try {
      const formData = new FormData();
      formData.append("file", file); // Add the file to FormData

      const response = await axios.post(
        `${BASE_URL}/upload-schooldata`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Important for file uploads
          },
        }
      );

      console.log(response.data);

      if (response.status === 200) {
        setUploadStatus({
          type: "success",
          message: "School data uploaded successfully",
        });
        setFile(null);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setUploadStatus({
        type: "error",
        message:
          error.response?.data?.message || "Failed to upload school data",
      });
    }
  };

  return (
    <div className="max-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bulk School Data Upload
          </h1>
          <p className="text-gray-600">
            Upload your school information using our CSV template
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
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
                <p className="mt-1 text-xs text-gray-500">CSV files only</p>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploadStatus?.type === "loading"}
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
                  Upload Data
                </>
              )}
            </button>

            {uploadStatus && (
              <div
                className={`p-4 rounded-lg text-sm flex items-center gap-2 ${uploadStatus.type === "success"
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

          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              File Requirements
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <p>File must be in CSV format with UTF-8 encoding</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <p>
                  Required columns: <strong>School Name</strong>,{" "}
                  <strong>School Code</strong>, <strong>Email Id</strong>,{" "}
                  <strong>School Mob No.</strong>
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <p>Maximum file size: 10MB</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <p>Each school must have a unique name and email address</p>
              </li>
            </ul>

            <div className="pt-4 border-t border-gray-200">
              <a
                href="/School-Master-Final-CSV.csv"
                className="hover:cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                download
              >
                <Download className="w-4 h-4" />
                Download CSV Template
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

export default UploadBulkSchoolData;
