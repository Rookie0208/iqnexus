"use client"
import React from "react"
import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import axios from "axios"
import { BASE_URL } from "../Api"

const Studymatview = () => {
  const [selectedLevel, setSelectedLevel] = useState("")
  const [studyMaterials, setStudyMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const student = JSON.parse(localStorage.getItem("student"))

  const fetchAdminStudyMaterial = async () => {
    setLoading(true)
    try {
        
      const response = await axios.get(`${BASE_URL}/fetchAdminStudyMaterial`, {});
      console.log("Response from fetchAdminStudyMaterial:", response)
      if (response.status === 200 && response.data) {

        const fetchedMaterials = response.data
        console.log("Student object:", fetchedMaterials);
        setStudyMaterials(fetchedMaterials)
      } else {
        console.error("Failed to fetch study materials.")
      }
    } catch (error) {
      console.error("Error fetching study materials:", error)
    }
    setLoading(false)
  }

  // Since your schema doesn't have isActive field, you can add this to your schema or remove this function
  const handleToggleActive = async (id, currentStatus) => {
    try {
      // Call your API to update the status
      await axios.post(`${BASE_URL}/updateStudyMaterialStatus`, {
        id,
        isActive: !currentStatus,
      })
      // Update local state
      setStudyMaterials((prev) => prev.map((item) => (item.id === id ? { ...item, isActive: !currentStatus } : item)))
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const filteredMaterials = selectedLevel
    ? studyMaterials.filter((item) => {
        return item.class?.toString() === selectedLevel
      })
    : studyMaterials

  useEffect(() => {
      fetchAdminStudyMaterial()
  },[])

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center text-blue-600">
          <FileText />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Study Material</h2>
      </div>
      <div className="bg-white shadow-lg rounded-xl overflow-hidden flex-grow">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Subject</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Fees(INR)</th>
              <th className="px-6 py-3 text-left">Link</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredMaterials.length > 0 ? (
              filteredMaterials.map((item, index) => {
                // Default status to active if undefined (since your schema doesn't have isActive)
                const isActive = item.isActive === undefined ? true : !!item.isActive
                return (
                  <tr
                    key={item.id || index}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium">{item.examId || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{item.category || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.class || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.cost !== undefined ? `${item.cost}` : "N/A"}</span>
                        
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.pdfLink ? (
                        <a
                          href={item.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition duration-150"
                        >
                          View PDF
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {/* Show free/paid status instead of active/inactive since your schema has isAvailableForFree */}
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-medium ${
                          item.isAvailableForFree === "true" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                        }`}
                      >
                        {item.isAvailableForFree === "true" ? "Free" : "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No study materials found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Studymatview
