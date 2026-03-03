import axios from "axios";
import React, { useState } from "react";
import { BASE_API_URL } from "../Api";

const Feedback = () => {
  const studentData = localStorage.getItem("student_data");
  const parsedStudent = studentData ? JSON.parse(studentData) : {};
  const [formData, setFormData] = useState({
    category: "complaint",
    message: "",
    status: "pending",
  });
  const [student] = useState({ rollNo: parsedStudent["Roll No"] || "", mobNo: parsedStudent["Mob No"] || "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      const result = await axios.post(`${BASE_API_URL}/storeFeedback`, {
        rollNo: student.rollNo,
        category: formData.category,
        message: formData.message,
        status: formData.status,
        mobileNo: student.mobNo,
      });
      if (result.data.success) {
        alert("Feedback submitted successfully!");
      } else {
        alert("Failed to submit feedback. Please try again later.");
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      alert("Failed to submit feedback. Please try again later.");
    }
    
    setFormData({ category: "complaint", message: "", status: "pending" });
  };



  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-lg p-8 transition-all duration-300 hover:scale-[1.01]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          💬 Submit Your Query
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="feedback">Query</option>
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roll No
            </label>
            <input
              type="text"
              value={student.rollNo}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile No
            </label>
            <input
              type="text"
              value={student.mobNo}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Type your message here..."
              required
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">Hold</option>
              <option value="resolved">Resolved</option>
            </select>
          </div> */}
         
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
