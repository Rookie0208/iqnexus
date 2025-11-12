import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";

const UpdateSchoolModal = ({ school, onClose, onSchoolUpdated }) => {
  const [formData, setFormData] = useState({
    schoolCode: school.schoolCode || "",
    schoolName: school.schoolName || "",
    schoolMobNo: school.schoolMobNo || "",
    schoolEmail: school.schoolEmail || "",
    area: school.area || "",
    city: school.city || "",
    zone: school.zone || "",
    state: school.state || "",
    country: school.country || "",
    principalName: school.principalName || "",
    principalMobNo: school.principalMobNo || "",
    principalDob: school.principalDob?.split("T")[0] || "",
    examCenterLevel1: school.examCenterLevel1 || "",
    examCenterLandmarkLevel1: school.examCenterLandmarkLevel1 || "",
    examCenterLevel2: school.examCenterLevel2 || "",
    examCenterLandmarkLevel2: school.examCenterLandmarkLevel2 || "",
    showAmountPaid: school.showAmountPaid || 0,
    showPerformance: school.showPerformance || 0,
    allowFreeDownload: school.allowFreeDownload || "YES",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatePayload = {
        schoolCode: parseInt(formData.schoolCode), // must be a Number
        schoolName: formData.schoolName,
        schoolMobNo: formData.schoolMobNo,
        schoolEmail: formData.schoolEmail,
        area: formData.area,
        city: formData.city,
        zone: formData.zone,
        state: formData.state,
        country: formData.country,
        principalName: formData.principalName,
        principalMobNo: formData.principalMobNo,
        principalDob: formData.principalDob,
        examCenterLevel1: formData.examCenterLevel1,
        examCenterLandmarkLevel1: formData.examCenterLandmarkLevel1,
        examCenterLevel2: formData.examCenterLevel2,
        examCenterLandmarkLevel2: formData.examCenterLandmarkLevel2,
        showAmountPaid: parseInt(formData.showAmountPaid),
        showPerformance: parseInt(formData.showPerformance),
        allowFreeDownload: formData.allowFreeDownload,
      };

      const res = await axios.put(`${BASE_URL}/school`, updatePayload);

      if (res.data.success) {
        onSchoolUpdated(res.data.updatedSchool);
        onClose();
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Error updating school:", err);
      setError(err.response?.data?.message || "Failed to update school.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Update School</h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              School Code (Read-Only)
            </label>
            <input
              type="text"
              name="schoolCode"
              value={formData.schoolCode}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              School Name
            </label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              School Mobile Number
            </label>
            <input
              type="text"
              name="schoolMobNo"
              value={formData.schoolMobNo}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              School Email
            </label>
            <input
              type="email"
              name="schoolEmail"
              value={formData.schoolEmail}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Area
            </label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Zone
            </label>
            <input
              type="text"
              name="zone"
              value={formData.zone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Principal Name
            </label>
            <input
              type="text"
              name="principalName"
              value={formData.principalName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Principal Mobile Number
            </label>
            <input
              type="text"
              name="principalMobNo"
              value={formData.principalMobNo}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Principal Date of Birth
            </label>
            <input
              type="date"
              name="principalDob"
              value={formData.principalDob}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Exam Center Level 1
            </label>
            <input
              type="text"
              name="examCenterLevel1"
              value={formData.examCenterLevel1}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Exam Center Landmark Level 1
            </label>
            <input
              type="text"
              name="examCenterLandmarkLevel1"
              value={formData.examCenterLandmarkLevel1}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Exam Center Level 2
            </label>
            <input
              type="text"
              name="examCenterLevel2"
              value={formData.examCenterLevel2}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Exam Center Landmark Level 2
            </label>
            <input
              type="text"
              name="examCenterLandmarkLevel2"
              value={formData.examCenterLandmarkLevel2}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Show Amount Paid (0 or 1)
            </label>
            <input
              type="number"
              name="showAmountPaid"
              value={formData.showAmountPaid}
              onChange={handleChange}
              min="0"
              max="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Show Performance (0 or 1)
            </label>
            <input
              type="number"
              name="showPerformance"
              value={formData.showPerformance}
              onChange={handleChange}
              min="0"
              max="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Allow Free Download
            </label>
            <select
              name="allowFreeDownload"
              value={formData.allowFreeDownload}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateSchoolModal;
