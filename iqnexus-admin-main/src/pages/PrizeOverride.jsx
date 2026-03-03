import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Award, Gift, UserPlus, UserMinus, ArrowLeftRight, Star,
  AlertCircle, CheckCircle, X, Search, Trash2
} from "lucide-react";
import { BASE_URL } from "../Api";

const PrizeOverride = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeSection, setActiveSection] = useState("assign");

  // Assign Prize
  const [assignData, setAssignData] = useState({ rollNo: "", prizeType: "", prizeDetails: "" });

  // Remove Prize
  const [removeData, setRemoveData] = useState({ rollNo: "", prizeType: "" });

  // Change Winner
  const [changeData, setChangeData] = useState({ fromRollNo: "", toRollNo: "", prizeType: "" });

  // Special Award
  const [specialData, setSpecialData] = useState({ rollNo: "", awardName: "", reason: "" });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/subjects`);
        if (res.data.success) setSubjects(res.data.subjects || []);
      } catch {
        console.error("Failed to fetch subjects");
      }
    };
    fetchSubjects();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const assignPrize = async () => {
    if (!assignData.rollNo || !assignData.prizeType) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/prize-override/assign`, {
        ...assignData,
        subject: selectedSubject,
        batchId: selectedBatch
      });
      if (res.data.success) {
        showMessage("success", `Prize '${assignData.prizeType}' assigned to ${assignData.rollNo}`);
        setAssignData({ rollNo: "", prizeType: "", prizeDetails: "" });
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to assign prize");
    }
    setLoading(false);
  };

  const removePrize = async () => {
    if (!removeData.rollNo || !removeData.prizeType) return;
    if (!confirm(`Remove prize '${removeData.prizeType}' from ${removeData.rollNo}?`)) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/prize-override/remove`, {
        ...removeData,
        subject: selectedSubject,
        batchId: selectedBatch
      });
      if (res.data.success) {
        showMessage("success", `Prize removed from ${removeData.rollNo}`);
        setRemoveData({ rollNo: "", prizeType: "" });
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to remove prize");
    }
    setLoading(false);
  };

  const changeWinner = async () => {
    if (!changeData.fromRollNo || !changeData.toRollNo || !changeData.prizeType) return;
    if (!confirm(`Transfer prize from ${changeData.fromRollNo} to ${changeData.toRollNo}?`)) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/prize-override/change-winner`, {
        ...changeData,
        subject: selectedSubject,
        batchId: selectedBatch
      });
      if (res.data.success) {
        showMessage("success", `Prize transferred from ${changeData.fromRollNo} to ${changeData.toRollNo}`);
        setChangeData({ fromRollNo: "", toRollNo: "", prizeType: "" });
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to change winner");
    }
    setLoading(false);
  };

  const assignSpecialAward = async () => {
    if (!specialData.rollNo || !specialData.awardName) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/prize-override/special-award`, {
        ...specialData,
        subject: selectedSubject,
        batchId: selectedBatch
      });
      if (res.data.success) {
        showMessage("success", `Special award '${specialData.awardName}' given to ${specialData.rollNo}`);
        setSpecialData({ rollNo: "", awardName: "", reason: "" });
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to assign special award");
    }
    setLoading(false);
  };

  const prizeTypes = [
    "Gold Medal", "Silver Medal", "Bronze Medal",
    "Certificate of Excellence", "Certificate of Merit",
    "Cash Prize", "Scholarship", "Trophy",
    "Book Voucher", "Tablet", "Other"
  ];

  const sections = [
    { key: "assign", label: "Assign Prize", icon: Gift, color: "blue" },
    { key: "remove", label: "Remove Prize", icon: Trash2, color: "red" },
    { key: "change", label: "Change Winner", icon: ArrowLeftRight, color: "purple" },
    { key: "special", label: "Special Award", icon: Star, color: "yellow" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award size={28} /> Prize Override
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manually assign, remove, or transfer prizes. Award special recognitions.
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage({ type: "", text: "" })} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Subject/Batch Selector */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
          <input
            type="text"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            placeholder="e.g., 2024-25"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === s.key
                ? `bg-${s.color}-50 text-${s.color}-700 border border-${s.color}-200`
                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <s.icon size={16} /> {s.label}
          </button>
        ))}
      </div>

      {!selectedSubject || !selectedBatch ? (
        <div className="text-center py-12 text-gray-400">
          <Award size={48} className="mx-auto mb-3 opacity-50" />
          <p>Select a subject and batch to manage prizes</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6">
          {/* Assign Prize */}
          {activeSection === "assign" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gift size={20} className="text-blue-600" /> Assign Prize to Student
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={assignData.rollNo}
                    onChange={(e) => setAssignData({ ...assignData, rollNo: e.target.value })}
                    placeholder="Student roll number"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Prize Type *</label>
                  <select
                    value={assignData.prizeType}
                    onChange={(e) => setAssignData({ ...assignData, prizeType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Prize</option>
                    {prizeTypes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Prize Details (optional)</label>
                  <input
                    type="text"
                    value={assignData.prizeDetails}
                    onChange={(e) => setAssignData({ ...assignData, prizeDetails: e.target.value })}
                    placeholder="e.g., ₹5000 cash prize for 1st place"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <button
                onClick={assignPrize}
                disabled={loading || !assignData.rollNo || !assignData.prizeType}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Gift size={16} /> {loading ? "Assigning..." : "Assign Prize"}
              </button>
            </div>
          )}

          {/* Remove Prize */}
          {activeSection === "remove" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trash2 size={20} className="text-red-600" /> Remove Prize from Student
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={removeData.rollNo}
                    onChange={(e) => setRemoveData({ ...removeData, rollNo: e.target.value })}
                    placeholder="Student roll number"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Prize Type *</label>
                  <select
                    value={removeData.prizeType}
                    onChange={(e) => setRemoveData({ ...removeData, prizeType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Prize</option>
                    {prizeTypes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={removePrize}
                disabled={loading || !removeData.rollNo || !removeData.prizeType}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> {loading ? "Removing..." : "Remove Prize"}
              </button>
            </div>
          )}

          {/* Change Winner */}
          {activeSection === "change" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowLeftRight size={20} className="text-purple-600" /> Transfer Prize Between Students
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">From Roll No *</label>
                  <input
                    type="text"
                    value={changeData.fromRollNo}
                    onChange={(e) => setChangeData({ ...changeData, fromRollNo: e.target.value })}
                    placeholder="Current winner"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">To Roll No *</label>
                  <input
                    type="text"
                    value={changeData.toRollNo}
                    onChange={(e) => setChangeData({ ...changeData, toRollNo: e.target.value })}
                    placeholder="New winner"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Prize Type *</label>
                  <select
                    value={changeData.prizeType}
                    onChange={(e) => setChangeData({ ...changeData, prizeType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Prize</option>
                    {prizeTypes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={changeWinner}
                disabled={loading || !changeData.fromRollNo || !changeData.toRollNo || !changeData.prizeType}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowLeftRight size={16} /> {loading ? "Transferring..." : "Transfer Prize"}
              </button>
            </div>
          )}

          {/* Special Award */}
          {activeSection === "special" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star size={20} className="text-yellow-600" /> Assign Special Award
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Special awards are independent of ranks or automatic prize distribution.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={specialData.rollNo}
                    onChange={(e) => setSpecialData({ ...specialData, rollNo: e.target.value })}
                    placeholder="Student roll number"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Award Name *</label>
                  <input
                    type="text"
                    value={specialData.awardName}
                    onChange={(e) => setSpecialData({ ...specialData, awardName: e.target.value })}
                    placeholder="e.g., Best Improvement Award"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Reason</label>
                  <textarea
                    value={specialData.reason}
                    onChange={(e) => setSpecialData({ ...specialData, reason: e.target.value })}
                    placeholder="Reason for the special award..."
                    rows="2"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <button
                onClick={assignSpecialAward}
                disabled={loading || !specialData.rollNo || !specialData.awardName}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Star size={16} /> {loading ? "Assigning..." : "Assign Special Award"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrizeOverride;
