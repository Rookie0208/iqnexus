import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";

const AllSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchSchools(currentPage);
  }, [currentPage]);

  const fetchSchools = async (page) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/all-schools?page=${page}&limit=${limit}`
      );
      if (res.data.success) {
        setSchools(res.data.schools);
        setTotalPages(res.data.totalPages || 1);
        setTotalSchools(res.data.totalSchools || res.data.schools.length);
      } else {
        setSchools([]);
        setTotalPages(1);
        setTotalSchools(0);
        setError("No schools found.");
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
      setSchools([]);
      setTotalPages(1);
      setTotalSchools(0);
      setError("Failed to fetch schools. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schoolCode) => {
    if (window.confirm(`Are you sure you want to delete school with code ${schoolCode}?`)) {
      try {
        const res = await axios.delete(`${BASE_URL}/school/${schoolCode}`);
        alert(res.data.message);
        fetchSchools(currentPage);
      } catch (err) {
        console.error("Error deleting school:", err);
        alert(err.response?.data?.message || "Failed to delete school.");
      }
    }
  };

  const openUpdateModal = (school) => {
    setSelectedSchool(school);
    const formattedData = {
      schoolCode: school.schoolCode ? Number(school.schoolCode) : "",
      schoolName: school.schoolName || "",
      schoolEmail: school.schoolEmail || "",
      fax: school.fax || "",
      area: school.area || "",
      city: school.city || "",
      country: school.country || "",
      incharge: school.incharge || "",
      inchargeDob: school.inchargeDob?.split("T")[0] || "",
      schoolMobNo: school.schoolMobNo || "",
      principalName: school.principalName || "",
      principalDob: school.principalDob?.split("T")[0] || "",
      principalMobNo: school.principalMobNo || "",
      remark: school.remark || "",
    };
    setUpdatedData(formattedData);
    setIsModalOpen(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        schoolCode: Number(selectedSchool.schoolCode),
        ...updatedData,
      };
      const res = await axios.put(`${BASE_URL}/school`, payload);
      alert(res.data.message);
      setIsModalOpen(false);
      fetchSchools(currentPage);
    } catch (err) {
      console.error("Error updating school:", err);
      const errorMessage = err.response?.data?.message || "Failed to update school.";
      alert(errorMessage);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Schools</h1>

        {loading && (
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
              />
            </svg>
            <p className="mt-2 text-gray-600">Loading schools...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && schools.length === 0 && (
          <div className="text-center text-gray-600">
            <p>No schools available.</p>
          </div>
        )}

        {!loading && !error && schools.length > 0 && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-100 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-left">School Name</th>
                    <th className="px-6 py-3 text-left">School Code</th>
                    <th className="px-6 py-3 text-left">City</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school, idx) => (
                    <tr
                      key={idx}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                            {school.schoolName
                              ? school.schoolName.charAt(0)
                              : "N/A"}
                          </div>
                          <span className="ml-3 font-medium">
                            {school.schoolName || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {school.schoolCode || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {school.city || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openUpdateModal(school)}
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(school.schoolCode)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition duration-150"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} | Showing{" "}
                  {(currentPage - 1) * limit + 1} to{" "}
                  {Math.min(currentPage * limit, totalSchools)} of{" "}
                  {totalSchools} schools
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
                          className={`px-3 py-1 rounded-md ${currentPage === item
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
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out">
            <div
              className="absolute inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Update School Details
              </h2>
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(updatedData)
                    .filter(
                      (key) =>
                        key !== "_id" &&
                        key !== "__v" &&
                        key !== "createdAt" &&
                        key !== "updatedAt"
                    )
                    .map((field, idx) => (
                      <div key={idx}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <input
                          type={
                            field === "inchargeDob" || field === "principalDob"
                              ? "date"
                              : field === "schoolCode"
                                ? "number"
                                : field === "schoolEmail"
                                  ? "email"
                                  : "text"
                          }
                          name={field}
                          value={updatedData[field]}
                          onChange={handleUpdateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                          readOnly={field === "schoolCode"}
                        />
                      </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSchools;