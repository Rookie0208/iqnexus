import axios from 'axios';
import React, { useState } from 'react';
import { BASE_URL } from '../Api';

const TeachersData = () => {
    const [formData, setFormData] = useState({
        schoolCode: '',
        class: '',
        section: '',
        classTeacher: '',
        classTeacherMobNo: '',
        classTeacherEmail: '',
        examInchargeDob: '',
        examInchargeName: '',
        examInchargeMobNo: '',
        examInchargeEmail: '',
        classTeacherDob: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        const formDataToSubmit = new FormData();
        Object.keys(formData).forEach(key => {
            formDataToSubmit.append(key, formData[key]);
        });

        if (selectedFile) {
            formDataToSubmit.append('file', selectedFile);
        }

        const result = await axios.post(`${BASE_URL}/createExamIncharge`, formDataToSubmit, {
            headers: {
            'Content-Type': 'multipart/form-data'
            }

        });
           e.preventDefault();


        if (result.status === 200) {
            alert("Data submitted successfully!");
            // handleReset();
        } else {
            alert("Failed to submit data. Please try again.");
        }

        // Reset form after submission
        handleReset(
)
    };


    const handleExcelUpload = async() => {


        const formDataToSubmit = new FormData();


  
            formDataToSubmit.append('file', selectedFile);
        

        const result = await axios.post(`${BASE_URL}/createExamIncharge`, formDataToSubmit, {
            headers: {
            'Content-Type': 'multipart/form-data'
            }

        });
           e.preventDefault();


        if (result.status === 200) {
            alert("Data submitted successfully!");
            // handleReset();
        } else {
            alert("Failed to submit data. Please try again.");
        }

        // Reset form after submission
        handleReset(
)
    };
    const handleReset = () => {
        setFormData({
            schoolCode: '',
            class: '',
            section: '',
            classTeacher: '',
            classTeacherMobNo: '',
            classTeacherEmail: '',
            examInchargeDob: '',
            examInchargeName: '',
            examInchargeMobNo: '',
            examInchargeEmail: '',
            classTeacherDob: ''
        });
        setSelectedFile(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            setSelectedFile(file);
        } else {
            alert("Please select a valid Excel file (.xls or .xlsx)");
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                setSelectedFile(file);
            } else {
                alert("Please select a valid Excel file (.xls or .xlsx)");
            }
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
    };

    return (
        <div className="min-h-screen  p-5 md:p-8 rounded-2xl">
            <div className="max-w-6xl mx-auto">
 
        

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-sm">
                    <div className="text-center mb-8 text-white">
                    <h1 className="text-4xl text-gray-800 md:text-5xl font-bold mb-3">
                        Teachers Data Form
                    </h1>
                    <p className="text-lg text-gray-800 md:text-xl opacity-90">
                        Enter the teacher and exam incharge information
                    </p>
                </div>
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-4 border-indigo-500 inline-block">
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col">
                                <label htmlFor="schoolCode" className="font-semibold text-gray-700 mb-2 text-sm">
                                    School Code
                                </label>
                                <input
                                    type="text"
                                    id="schoolCode"
                                    name="schoolCode"
                                    value={formData.schoolCode}
                                    onChange={handleChange}
                                    placeholder="Enter school code"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="class" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Class
                                </label>
                                <select
                                    id="class"
                                    name="class"
                                    value={formData.class}
                                    onChange={handleChange}
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                >
                                    <option value="">Select Class</option>
                                    <option value="1">Class 1</option>
                                    <option value="2">Class 2</option>
                                    <option value="3">Class 3</option>
                                    <option value="4">Class 4</option>
                                    <option value="5">Class 5</option>
                                    <option value="6">Class 6</option>
                                    <option value="7">Class 7</option>
                                    <option value="8">Class 8</option>
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="section" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Section
                                </label>
                                <select
                                    id="section"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                >
                                    <option value="">Select Section</option>
                                    <option value="A">Section A</option>
                                    <option value="B">Section B</option>
                                    <option value="C">Section C</option>
                                    <option value="D">Section D</option>
                                    <option value="E">Section E</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Class Teacher Information Section */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-4 border-indigo-500 inline-block">
                            Class Teacher Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label htmlFor="classTeacher" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Class Teacher Name
                                </label>
                                <input
                                    type="text"
                                    id="classTeacher"
                                    name="classTeacher"
                                    value={formData.classTeacher}
                                    onChange={handleChange}
                                    placeholder="Enter teacher's full name"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="classTeacherMobNo" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    id="classTeacherMobNo"
                                    name="classTeacherMobNo"
                                    value={formData.classTeacherMobNo}
                                    onChange={handleChange}
                                    placeholder="Enter 10-digit mobile number"
                                    pattern="[0-9]{10}"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="classTeacherEmail" className="font-semibold text-gray-700 mb-2 text-sm">
                                    classTeacherEmail
                                </label>
                                <input
                                    type="classTeacherEmail"
                                    id="classTeacherEmail"
                                    name="classTeacherEmail"
                                    value={formData.classTeacherEmail}
                                    onChange={handleChange}
                                    placeholder="Enter classTeacherEmail address"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="examInchargeDob" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    id="examInchargeDob"
                                    name="examInchargeDob"
                                    value={formData.examInchargeDob}
                                    onChange={handleChange}
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exam Incharge Information Section */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-4 border-indigo-500 inline-block">
                            Exam Incharge Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label htmlFor="examInchargeName" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Exam Incharge Name
                                </label>
                                <input
                                    type="text"
                                    id="examInchargeName"
                                    name="examInchargeName"
                                    value={formData.examInchargeName}
                                    onChange={handleChange}
                                    placeholder="Enter exam incharge's full name"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="examInchargeMobNo" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Exam Incharge Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    id="examInchargeMobNo"
                                    name="examInchargeMobNo"
                                    value={formData.examInchargeMobNo}
                                    onChange={handleChange}
                                    placeholder="Enter 10-digit mobile number"
                                    pattern="[0-9]{10}"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="examInchargeEmail" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Exam Incharge classTeacherEmail
                                </label>
                                <input
                                    type="classTeacherEmail"
                                    id="examInchargeEmail"
                                    name="examInchargeEmail"
                                    value={formData.examInchargeEmail}
                                    onChange={handleChange}
                                    placeholder="Enter classTeacherEmail address"
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="classTeacherDob" className="font-semibold text-gray-700 mb-2 text-sm">
                                    Exam Incharge Date of Birth
                                </label>
                                <input
                                    type="date"
                                    id="classTeacherDob"
                                    name="classTeacherDob"
                                    value={formData.classTeacherDob}
                                    onChange={handleChange}
                                    required
                                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 bg-gray-50 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-4 border-indigo-500 inline-block">
                            Upload Excel File (Optional)
                        </h2>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Upload an Excel file with teacher data to bulk import information. Accepted formats: .xls, .xlsx
                            </p>
                            
                            <div 
                                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                                    dragActive 
                                        ? 'border-indigo-500 bg-indigo-50' 
                                        : 'border-gray-300 hover:border-indigo-400'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    id="fileUpload"
                                />
                                
                                {!selectedFile ? (
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div className="text-lg font-semibold text-gray-700 mb-2">
                                            Drop your Excel file here, or <span className="text-indigo-600">browse</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Supports: .xlsx, .xls (Max size: 10MB)
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-lg font-semibold text-green-700 mb-2">
                                            File Selected Successfully!
                                        </div>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="font-medium text-green-800">{selectedFile.name}</p>
                                                        <p className="text-sm text-green-600">
                                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                                >
                                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('fileUpload').click()}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                                        >
                                            Choose a different file
                                        </button>
                                    </div>
                                )}
                            </div>

                            {selectedFile && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">
                                                Note: Uploading an Excel file will populate the form fields automatically.
                                            </p>
                                            <p className="text-sm text-blue-600 mt-1">
                                                Make sure your Excel file has the correct column headers matching the form fields.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-8 border-t-2 border-gray-100">
                        <button 
                            type="button" 
                            onClick={handleReset} 
                            className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold text-base transition-all duration-300 hover:bg-gray-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                            Reset Form
                        </button>

                        {
                            selectedFile ?
                                   <button 
                                onClick={handleExcelUpload}
                            type="button" 
                            className="w-full sm:w-auto px-8 py-3 bg-[#024fb5] text-white rounded-lg font-semibold text-base transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            Submit Teacher Data
                        </button>:
                               <button 
                            type="submit" 
                            className="w-full sm:w-auto px-8 py-3 bg-[#024fb5] text-white rounded-lg font-semibold text-base transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            Submit Teacher Data
                        </button>

                        }
                 
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeachersData;