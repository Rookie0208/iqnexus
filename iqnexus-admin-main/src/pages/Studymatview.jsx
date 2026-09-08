import React, { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import axios from "axios"
import { BASE_URL } from "../Api"

const EXAM_LABELS = {
  IAOL1: "IQROL1",
  ITSTL1: "IQSOL1",
  IMOL1: "IQMOL1",
  IGKOL1: "IQGKOL1",
  IENGOL1: "IQEOL1",
  IAOL2: "IQROL2",
  ITSTL2: "IQSOL2",
  IMOL2: "IQMOL2",
  IENGOL2: "IQEOL2",
  IQKD: "IQKD",
  IQKD1: "IQKD L1",
  IQKD2: "IQKD L2",
}

const formatExam = (examId) => {
  if (!examId) return "N/A"
  const label = EXAM_LABELS[examId]
  return label ? `${label} (${examId})` : examId
}

const formatClass = (classValue) => {
  if (classValue === "kindergarten") return "Kindergarten"
  return classValue ? `Class ${classValue}` : "N/A"
}

const Studymatview = () => {
  const [classFilter, setClassFilter] = useState("")
  const [studyMaterials, setStudyMaterials] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAdminStudyMaterial = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${BASE_URL}/fetchAdminStudyMaterial`)
      setStudyMaterials(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error fetching study materials:", error)
      setStudyMaterials([])
    }
    setLoading(false)
  }

  const handleDelete = async (id, materialName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${materialName}"?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    try {
      const response = await axios.delete(`${BASE_URL}/deleteStudyMaterial/${id}`)
      if (response.status === 200) {
        setStudyMaterials((prev) =>
          prev.filter((item) => String(item._id) !== String(id))
        )
        alert("Study material deleted successfully")
      }
    } catch (error) {
      console.error("Failed to delete study material:", error)
      alert(error.response?.data?.message || "Failed to delete study material. Please try again.")
    }
  }

  const classFilterOptions = [
    ...new Set(studyMaterials.map((item) => String(item.class))),
  ].sort()

  const filteredMaterials = classFilter
    ? studyMaterials.filter((item) => String(item.class) === classFilter)
    : studyMaterials

  useEffect(() => {
    fetchAdminStudyMaterial()
  }, [])

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center text-blue-600">
          <FileText />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Study Material</h2>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="ml-auto border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All classes</option>
          {classFilterOptions.map((cls) => (
            <option key={cls} value={cls}>
              {formatClass(cls)}
            </option>
          ))}
        </select>
        <button
          onClick={fetchAdminStudyMaterial}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-xl overflow-hidden flex-grow">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Exam</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Fee (INR)</th>
              <th className="px-6 py-3 text-left">Link</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredMaterials.length > 0 ? (
              filteredMaterials.map((item, index) => {
                const isFree =
                  item.isAvailableForFree === "true" || Number(item.cost) === 0
                return (
                  <tr
                    key={item._id || index}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium">{formatExam(item.examId)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{item.category || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatClass(item.class)}
                        </span>
                        {item.kgSection && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {item.kgSection}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {item.cost !== undefined && item.cost !== null ? item.cost : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.pdfLink ? (
                        <a
                          href={item.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition duration-150"
                        >
                          Open
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-medium ${
                          isFree ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                        }`}
                      >
                        {isFree ? "Free" : "Paid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, item.category || item.examId)}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition duration-150"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
