import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";
import { Calendar, Plus, Check, Trash2, Edit2, X } from "lucide-react";

const CalendarYearManagement = () => {
  const [calendarYears, setCalendarYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCalendarYears();
  }, []);

  const fetchCalendarYears = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/calendar-years`);
      setCalendarYears(res.data.data || []);
    } catch {
      setError("Failed to fetch calendar years");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.startDate || !formData.endDate) {
      setError("Both start date and end date are required");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/calendar-year/${editingId}`, {
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
        setSuccess("Calendar year updated successfully");
      } else {
        await axios.post(`${BASE_URL}/calendar-year`, {
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
        setSuccess("Calendar year created successfully");
      }
      setFormData({ startDate: "", endDate: "" });
      setShowForm(false);
      setEditingId(null);
      fetchCalendarYears();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save calendar year");
    }
  };

  const handleSetCurrent = async (id) => {
    setError("");
    setSuccess("");
    try {
      await axios.put(`${BASE_URL}/calendar-year/${id}/set-current`);
      setSuccess("Current calendar year updated");
      fetchCalendarYears();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set current year");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this calendar year?")) return;
    setError("");
    setSuccess("");
    try {
      await axios.delete(`${BASE_URL}/calendar-year/${id}`);
      setSuccess("Calendar year deleted");
      fetchCalendarYears();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete calendar year");
    }
  };

  const handleEdit = (cy) => {
    setEditingId(cy._id);
    setFormData({
      startDate: cy.startDate ? cy.startDate.split("T")[0] : "",
      endDate: cy.endDate ? cy.endDate.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ startDate: "", endDate: "" });
    setShowForm(false);
  };

  // Pre-fill default dates (Apr 1 to Mar 30 next year) for new calendar year
  const handleNewCalendarYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based
    const year = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    setFormData({
      startDate: `${year}-04-01`,
      endDate: `${year + 1}-03-31`,
    });
    setEditingId(null);
    setShowForm(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">Calendar Year Management</h1>
        </div>
        {!showForm && (
          <button
            onClick={handleNewCalendarYear}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Add Calendar Year
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-5 bg-white border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Calendar Year" : "Create New Calendar Year"}
          </h2>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">e.g. April 1</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">e.g. March 31 of next year</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Years List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : calendarYears.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No calendar years configured. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {calendarYears.map((cy) => (
            <div
              key={cy._id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                cy.isCurrent
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    cy.isCurrent ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <div>
                  <div className="font-semibold text-lg text-gray-800">
                    {cy.label}
                    {cy.isCurrent && (
                      <span className="ml-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(cy.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    &mdash;{" "}
                    {new Date(cy.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!cy.isCurrent && (
                  <button
                    onClick={() => handleSetCurrent(cy._id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    title="Set as current"
                  >
                    <Check size={14} /> Set Current
                  </button>
                )}
                <button
                  onClick={() => handleEdit(cy)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(cy._id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-1">How Calendar Years Work</h3>
        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>The admin sets the start and end dates for each calendar year manually.</li>
          <li>The <strong>current</strong> calendar year is automatically assigned to new students during upload or manual addition.</li>
          <li>Only one calendar year can be set as current at a time.</li>
          <li>Changing the current year does not affect existing students.</li>
        </ul>
      </div>
    </div>
  );
};

export default CalendarYearManagement;
