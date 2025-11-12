import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";
import { generateResultCardPDF } from "../services/resultCard";

const Results = () => {
  const student = useSelector((state) => state.auth.user);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchResult = async () => {
    try {
      setIsLoading(true);
      const session = "2024-25";
      const rollNo = student?.["Roll No"] || student?.rollNo || "";
      const studentClass = student?.Class || student?.class || "";

      // Fetch result data (JSON)
      const res = await axios.get(
        `${BASE_API_URL}/getresult?rollNo=${rollNo}&class=${studentClass}&session=${session}`
      );
      console.log("Result Data:", res.data);
      if(
        res.data
      )
      {

      
      setResult(res.data);
      }
      setIsLoading(false);
      
      
    } catch (err) {
      setError(true);
    }
  };

  useEffect(() => {
    fetchResult();
    // eslint-disable-next-line
  }, []);

  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    setTimeout(() => {
      link.click();
    }, 100);
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async (subjectKey = null, subjectValue = null) => {
    try {
      const studentData = JSON.parse(localStorage.getItem('student_data'));
      
      // If specific subject is provided, create result object with only that subject
      const resultData = subjectKey && subjectValue 
        ? { 
            studentName: result.studentName,
            [subjectKey]: subjectValue 
          }
        : result;
      
      await generateResultCardPDF(resultData, studentData);
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-white px-8 py-6 rounded-2xl shadow-lg border border-gray-100 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
              <FileText className="text-white" size={28} />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Result Card
              </h1>
              <p className="text-gray-500 text-lg mt-1">Academic Performance Dashboard</p>
            </div>
          </div>
        </div>

      {/* Result Card Container */}
      {/* <div className="flex items-center justify-center">
        <div className="relative w-full max-w-3xl animate-slideUp transition-all">
          {resultImage ? (
            <img src={resultImage} alt="Result Card" className="w-full" />
          ) : (
            <div className="flex items-center justify-center h-64">
              {error ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow-md">
                  <p className="font-semibold">
                    Result Not Found. Please contact support for assistance.
                  </p>
                </div>
              ) : (
                "Loading Result..."
              )}
            </div>
          )}
        </div>
      </div> */}

        {/* Download Button */}
        {result && (
          <div className="flex justify-center items-center mb-8">
            <button
              onClick={() => handleDownloadPDF()}
              className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Download size={20} className="group-hover:animate-bounce" />
              <span className="font-semibold text-lg">Download All Results</span>
            </button>
          </div>
        )}

        {/* Result Table */}
        {!isLoading ? (
          result ? (
            Object.entries(result).map(([key, value]) => (
              Object.keys(value).length > 0 && (
                <div key={key} className="mt-8 w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <FileText size={20} className="text-white" />
                          </div>
                          {key.replace(/([A-Z])/g, ' $1').trim()} - Result Card
                        </h3>
                        <p className="text-blue-100 mt-1">Individual subject performance</p>
                      </div>
                      <button
                        onClick={() => handleDownloadPDF(key, value)}
                        className="group bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                      >
                        <Download size={18} className="group-hover:animate-bounce" />
                        <span className="font-semibold">Download PDF</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                    <div className="font-bold mb-4 text-xl text-gray-800 border-b border-gray-200 pb-2">
                      Student Name: <span className="font-normal text-blue-600">{result.studentName}</span>
                    </div>
                    <table className="w-full mb-4 text-sm bg-white rounded-lg shadow-sm overflow-hidden">
                      <tbody>
                        <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Roll No:</td>
                          <td className="py-3 px-4">{JSON.parse(localStorage.getItem('student_data'))['Roll No']}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Class:</td>
                          <td className="py-3 px-4">{JSON.parse(localStorage.getItem('student_data'))['Class']}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Section:</td>
                          <td className="py-3 px-4">{JSON.parse(localStorage.getItem('student_data'))['Section']}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">School:</td>
                          <td className="py-3 px-4">{JSON.parse(localStorage.getItem('student_data'))['School']}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Mark Scored:</td>
                          <td className="py-3 px-4 font-semibold text-green-600">{value.marksObtained}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Percentage:</td>
                          <td className="py-3 px-4 font-semibold text-green-600">{Math.round((value.marksObtained/value.totalMarks)*100)}%</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Percentile Score:</td>
                          <td className="py-3 px-4 font-semibold text-blue-600">{value.percentileScore}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">School Rank:</td>
                          <td className="py-3 px-4 font-semibold text-yellow-600">{value.schoolRank}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Zonal Rank:</td>
                          <td className="py-3 px-4 font-semibold text-yellow-600">{value.zonalRank}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">National Rank:</td>
                          <td className="py-3 px-4 font-semibold text-yellow-600">{value.nationalRank}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">International Rank:</td>
                          <td className="py-3 px-4 font-semibold text-yellow-600">{value.internationRank}</td>
                        </tr>
                        <tr className="hover:bg-purple-50 transition-colors">
                          <td className="font-semibold py-3 px-4 text-gray-700 bg-gray-50">Qualified For 2nd Level:</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              value.passOrFail === "pass" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {value.passOrFail === "pass" ? "✓ Yes" : "✗ No"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-gray-100">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="text-red-600" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Result Not Found</h3>
                <p className="text-gray-600 leading-relaxed">No results available for the current session. Please contact support if you believe this is an error.</p>
                <div className="mt-6">
                  <div className="inline-flex items-center px-4 py-2 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-700 text-sm font-medium">Status: Not Available</span>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-gray-100">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <FileText className="text-blue-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Loading Results...</h3>
              <p className="text-gray-600 leading-relaxed mb-6">Please wait while we fetch your academic results.</p>
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ); 
};

export default Results;
