import React, { useEffect, useState } from "react";
import "../styles/StudyMaterials.css";
import { FileText } from "lucide-react";
import { useSelector } from "react-redux";
import { BASE_API_URL } from "../Api";
import axios from "axios";

const StudyMaterials = () => {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [studyMaterials, setStudyMaterials] = useState([]);
  const student = useSelector((state) => state.auth.user);

  const fetchStudyMaterials = async () => {
    try {
      const response = await axios.post(`${BASE_API_URL}/fetchStudyMaterial`, {
        className: student["Class"],
        rollNo: student["Roll No"],
      });

      if (response.status === 200 && response.data) {
        const fetchedMaterials = response.data.data
        console.log("Study materials:", fetchedMaterials);
        setStudyMaterials(fetchedMaterials);
      } else {
        console.error("Failed to fetch study materials.");
      }
    } catch (error) {
      console.error("Error fetching study materials:", error);
    }
  };

  const filteredMaterials = selectedLevel
    ? studyMaterials.filter((item) => {
        const levelFromExamId = item.examId?.slice(-1); // "IAOL1" => "1"
        return levelFromExamId === selectedLevel;
      })
    : studyMaterials;

  useEffect(() => {
    if (student) {
      fetchStudyMaterials();
    }
  }, [student]);

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center text-blue-600">
          <FileText />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Study Material</h2>
      </div>

      {/* Filters */}
      {/* <div className="flex flex-col w-full items-center gap-4 mb-6 max-w-md mx-auto">
        <select
          className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">Select Level</option>
          <option value="1">Level 1</option> 
           <option value="2"></option>
        </select>
      </div> */}

      {/* Study Materials Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden flex-grow">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Exam</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Cost</th>
              <th className="px-6 py-3 text-right">Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length > 0 ? (
              studyMaterials.map((item, index) => (
              item.map((item, index) => (
   <tr
                  key={item._id || index}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {item.examId ? item.examId.charAt(0) : "N/A"}
                      </div>
                      <span className="ml-3 font-medium">{item.examId || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{item.category || "N/A"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {item.cost !== undefined ? item.cost : "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={item.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition duration-150"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                      View
                    </a>
                  </td>
                </tr>

              ))
                // <tr
                //   key={item._id || index}
                //   className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                // >
                //   <td className="px-6 py-4">
                //     <div className="flex items-center">
                //       <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                //         {item.examId ? item.examId.charAt(0) : "N/A"}
                //       </div>
                //       <span className="ml-3 font-medium">{item.examId || "N/A"}</span>
                //     </div>
                //   </td>
                //   <td className="px-6 py-4">
                //     <span className="text-gray-600">{item.category || "N/A"}</span>
                //   </td>
                //   <td className="px-6 py-4">
                //     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                //       {item.cost !== undefined ? item.cost : "N/A"}
                //     </span>
                //   </td>
                //   <td className="px-6 py-4 text-right">
                //     <a
                //       href={item.pdfLink}
                //       target="_blank"
                //       rel="noopener noreferrer"
                //       className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition duration-150"
                //     >
                //       <svg
                //         className="w-4 h-4 mr-1"
                //         fill="none"
                //         stroke="currentColor"
                //         viewBox="0 0 24 24"
                //         xmlns="http://www.w3.org/2000/svg"
                //       >
                //         <path
                //           strokeLinecap="round"
                //           strokeLinejoin="round"
                //           strokeWidth="2"
                //           d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                //         ></path>
                //         <path
                //           strokeLinecap="round"
                //           strokeLinejoin="round"
                //           strokeWidth="2"
                //           d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                //         ></path>
                //       </svg>
                //       View
                //     </a>
                //   </td>
                // </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No study materials found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudyMaterials;