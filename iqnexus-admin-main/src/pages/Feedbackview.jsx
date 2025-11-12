import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import axios from "axios"
import React from "react"
import { BASE_URL } from "../Api"

const FeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const student = JSON.parse(localStorage.getItem("student"))

  const getFeedback = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${BASE_URL}/getFeedback`)
      console.log("Response from getFeedback:", response)

      if (response.status === 200 && response.data.success) {
        const fetchedFeedbacks = response.data.data
        setFeedbacks(fetchedFeedbacks)
      } else {
        console.error("Failed to fetch feedbacks.")
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    }
    setLoading(false)
  }

  const handleResolve = async (id, currentStatus) => {
    try {
      // Call your API to update the resolve status
      await axios.post(`${BASE_URL}/updateFeedbackStatus`, {
        id,
        isResolved: !currentStatus,
      })
      // Update local state
      setFeedbacks((prev) => prev.map((item) => (item._id === id ? { ...item, isResolved: !currentStatus } : item)))
    } catch (error) {
      console.error("Failed to update resolve status", error)
    }
  }

  useEffect(() => {
      getFeedback()
  }, [])

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center text-blue-600">
          <MessageSquare />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">FEED BACK</h2>
      </div>
      <div className="bg-white shadow-lg rounded-xl overflow-hidden flex-grow">
        <table className="min-w-full text-sm text-gray-700 border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-center border border-gray-300 font-semibold">SR.NO</th>
              <th className="px-4 py-3 text-center border border-gray-300">
                <div className="font-semibold">CHOSE OPTION</div>
                <div className="text-xs font-semibold mt-1">CATEGORY</div>
              </th>
              <th className="px-4 py-3 text-center border border-gray-300 font-semibold">ROLL NUMBER</th>
              <th className="px-4 py-3 text-center border border-gray-300 font-semibold">MOB NUMBER</th>
              <th className="px-4 py-3 text-center border border-gray-300 font-semibold">MSG BOX</th>
              <th className="px-4 py-3 text-center border border-gray-300 font-semibold">WHATSAPP</th>
              <th className="px-4 py-3 text-center border border-gray-300 font-semibold">RESOLVE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500 border border-gray-300">
                  Loading...
                </td>
              </tr>
            ) : feedbacks.length > 0 ? (
              feedbacks.map((item, index) => {
                const isResolved = item.isResolved || false
                return (
                  <tr key={item._id || index} className="hover:bg-gray-50 transition duration-200">
                    <td className="px-4 py-3 text-center border border-gray-300">
                      <span className="font-medium">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3 text-center border border-gray-300">
                      <span className="font-medium text-gray-900">{item.category?.toUpperCase() || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-center border border-gray-300">
                      <span className="text-gray-600">{item.rollNo || ""}</span>
                    </td>
                    <td className="px-4 py-3 text-center border border-gray-300">
                      <span className="text-gray-600">{item.mobileNo || ""}</span>
                    </td>
                    <td className="px-4 py-3 text-center border border-gray-300">
                      <span className="text-gray-600">{item.message || item.msgBox || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-center border border-gray-300">
                      {item.mobileNo ? (
                        <a
                          href={`https://wa.me/91${item.mobileNo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 underline hover:text-green-800"
                          title="Chat on WhatsApp"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border border-gray-300">
                      <button
                        type="button"
                        onClick={() => handleResolve(item._id, isResolved)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition duration-150 ${
                          isResolved
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {isResolved ? "RESOLVED" : "PENDING"}
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500 border border-gray-300">
                  No feedbacks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FeedbackView
