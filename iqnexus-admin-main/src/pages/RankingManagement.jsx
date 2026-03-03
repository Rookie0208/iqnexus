import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3, Settings, Shield, Lock, Unlock, RefreshCw,
  AlertCircle, CheckCircle, X, Search, Edit2, Save,
  ArrowRight, Users, Award, ChevronDown, Crown, Target
} from "lucide-react";
import { BASE_URL } from "../Api";

const TABS = [
  { key: "qualification", label: "Qualification Settings", icon: Target },
  { key: "ranking", label: "Calculate Ranks", icon: BarChart3 },
  { key: "override", label: "Admin Override", icon: Shield },
  { key: "workflow", label: "Result Workflow", icon: Lock },
];

const RankingManagement = () => {
  const [activeTab, setActiveTab] = useState("qualification");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Qualification state
  const [qualSettings, setQualSettings] = useState(null);

  // Ranking state
  const [rankingResult, setRankingResult] = useState(null);

  // Override state
  const [editMarksData, setEditMarksData] = useState({});
  const [manualRankData, setManualRankData] = useState({ rollNo: "", rankType: "internationalRank", rankValue: 1 });
  const [jointRankData, setJointRankData] = useState({ rollNumbers: "", rankType: "internationalRank", rankValue: 1 });

  // Workflow state
  const [workflowStatus, setWorkflowStatus] = useState(null);

  // Fetch subjects
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

  // ===== QUALIFICATION =====
  const fetchQualificationSettings = async () => {
    if (!selectedSubject || !selectedBatch) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/qualification-settings`, {
        params: { subject: selectedSubject, batchId: selectedBatch }
      });
      if (res.data.success) setQualSettings(res.data.data);
    } catch {
      showMessage("error", "Failed to load qualification settings");
    }
    setLoading(false);
  };

  const updateQualificationSettings = async (qualifyingPercentage) => {
    try {
      await axios.post(`${BASE_URL}/qualification-settings`, {
        subject: selectedSubject,
        batchId: selectedBatch,
        qualifyingPercentage
      });
      showMessage("success", `Qualifying percentage updated to ${qualifyingPercentage}%`);
      fetchQualificationSettings();
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to update");
    }
  };

  const recalculateQualification = async () => {
    if (!confirm("This will recalculate pass/fail for all students. Continue?")) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/recalculate-qualification`, {
        subject: selectedSubject,
        batchId: selectedBatch
      });
      if (res.data.success) {
        showMessage("success", `Recalculated: ${res.data.data.passed} passed, ${res.data.data.failed} failed out of ${res.data.data.totalStudents}`);
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Recalculation failed");
    }
    setLoading(false);
  };

  // ===== RANKING =====
  const calculateRanks = async () => {
    if (!selectedSubject || !selectedBatch) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/calculate-ranks`, {
        subject: selectedSubject,
        batchId: selectedBatch
      });
      if (res.data.success) {
        setRankingResult(res.data.data);
        showMessage("success", `Ranks calculated for ${res.data.data.totalStudents} students (${res.data.data.tiesFound} ties resolved)`);
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Ranking failed");
    }
    setLoading(false);
  };

  // ===== ADMIN OVERRIDE =====
  const editStudentMarks = async () => {
    if (!editMarksData.rollNo || !editMarksData.field) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/override/edit-marks`, {
        rollNo: editMarksData.rollNo,
        subject: selectedSubject,
        batchId: selectedBatch,
        field: editMarksData.field,
        newValue: Number(editMarksData.newValue),
        reason: editMarksData.reason || "Admin override"
      });
      if (res.data.success) showMessage("success", "Student marks updated");
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to update marks");
    }
    setLoading(false);
  };

  const setManualRank = async () => {
    if (!manualRankData.rollNo) return;
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/override/set-rank`, {
        rollNo: manualRankData.rollNo,
        subject: selectedSubject,
        batchId: selectedBatch,
        rankType: manualRankData.rankType,
        rankValue: Number(manualRankData.rankValue)
      });
      showMessage("success", "Manual rank set");
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to set rank");
    }
    setLoading(false);
  };

  const assignJointRank = async () => {
    const rollNumbers = jointRankData.rollNumbers.split(",").map(r => r.trim()).filter(Boolean);
    if (rollNumbers.length < 2) return showMessage("error", "Need at least 2 roll numbers");
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/override/joint-rank`, {
        rollNumbers,
        subject: selectedSubject,
        batchId: selectedBatch,
        rankType: jointRankData.rankType,
        rankValue: Number(jointRankData.rankValue)
      });
      showMessage("success", `Joint rank assigned to ${rollNumbers.length} students`);
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to assign joint rank");
    }
    setLoading(false);
  };

  // ===== RESULT WORKFLOW =====
  const fetchWorkflowStatus = async () => {
    if (!selectedSubject || !selectedBatch) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/result-workflow/status`, {
        params: { subject: selectedSubject, batchId: selectedBatch }
      });
      if (res.data.success) setWorkflowStatus(res.data.data);
    } catch {
      showMessage("error", "Failed to load workflow status");
    }
    setLoading(false);
  };

  const changeWorkflowStatus = async (newStatus) => {
    if (!confirm(`Change status to '${newStatus}'?`)) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/result-workflow/status`, {
        subject: selectedSubject,
        batchId: selectedBatch,
        newStatus
      });
      if (res.data.success) {
        showMessage("success", `Status changed to ${newStatus}`);
        fetchWorkflowStatus();
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Status change failed");
    }
    setLoading(false);
  };

  const unlockResults = async () => {
    if (!confirm("Unlock results? This is a superadmin action.")) return;
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/result-workflow/unlock`, {
        subject: selectedSubject,
        batchId: selectedBatch
      });
      showMessage("success", "Results unlocked");
      fetchWorkflowStatus();
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Unlock failed");
    }
    setLoading(false);
  };

  // Auto-fetch on subject/batch/tab change
  useEffect(() => {
    if (!selectedSubject || !selectedBatch) return;
    if (activeTab === "qualification") fetchQualificationSettings();
    if (activeTab === "workflow") fetchWorkflowStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedBatch, activeTab]);

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    review: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    locked: "bg-red-100 text-red-700"
  };

  const rankTypes = [
    { value: "internationalRank", label: "International Rank" },
    { value: "nationalRank", label: "National Rank" },
    { value: "cityRank", label: "City Rank" },
    { value: "schoolRank", label: "School Rank" },
    { value: "classRank", label: "Class Rank" },
    { value: "sectionRank", label: "Section Rank" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ranking & Result Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Qualification settings, ranking engine, admin overrides, and result workflow
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {!selectedSubject || !selectedBatch ? (
        <div className="text-center py-12 text-gray-400">
          <Settings size={48} className="mx-auto mb-3 opacity-50" />
          <p>Select a subject and batch to get started</p>
        </div>
      ) : (
        <>
          {/* Qualification Tab */}
          {activeTab === "qualification" && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target size={20} /> Qualification Settings
                </h3>
                {qualSettings ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Qualifying Percentage:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={qualSettings.qualifyingPercentage || 40}
                        onChange={(e) => setQualSettings({ ...qualSettings, qualifyingPercentage: Number(e.target.value) })}
                        className="w-24 border rounded px-3 py-2 text-center text-lg font-bold"
                      />
                      <span className="text-gray-500">%</span>
                      <button
                        onClick={() => updateQualificationSettings(qualSettings.qualifyingPercentage)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Save size={16} /> Save
                      </button>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-500 mb-3">
                        Recalculate pass/fail for all students based on current qualifying percentage.
                      </p>
                      <button
                        onClick={recalculateQualification}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        {loading ? "Recalculating..." : "Recalculate All Students"}
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      Source: {qualSettings.source} | Subject: {qualSettings.subject}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">{loading ? "Loading..." : "No settings found. They will be created on save."}</div>
                )}
              </div>
            </div>
          )}

          {/* Ranking Tab */}
          {activeTab === "ranking" && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} /> Calculate Rankings
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Runs the multi-criteria tie-breaking algorithm and assigns International, National,
                  City, School, Class, and Section ranks to all students.
                </p>
                <button
                  onClick={calculateRanks}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 text-lg"
                >
                  <BarChart3 size={20} className={loading ? "animate-pulse" : ""} />
                  {loading ? "Calculating..." : "Calculate Ranks Now"}
                </button>

                {rankingResult && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-medium mb-3">Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">{rankingResult.totalStudents}</div>
                        <div className="text-xs text-blue-500">Total Students</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-green-700">{rankingResult.ranked}</div>
                        <div className="text-xs text-green-500">Ranked</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-yellow-700">{rankingResult.tiesFound}</div>
                        <div className="text-xs text-yellow-500">Ties Found</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-purple-700">{rankingResult.tiesResolved}</div>
                        <div className="text-xs text-purple-500">Ties Resolved</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Override Tab */}
          {activeTab === "override" && (
            <div className="space-y-6">
              {/* Edit Marks */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Edit2 size={20} /> Edit Student Marks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={editMarksData.rollNo || ""}
                      onChange={(e) => setEditMarksData({ ...editMarksData, rollNo: e.target.value })}
                      placeholder="Student roll number"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Field to Edit</label>
                    <select
                      value={editMarksData.field || ""}
                      onChange={(e) => setEditMarksData({ ...editMarksData, field: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Select field</option>
                      <option value="section1">Section 1</option>
                      <option value="section2">Section 2</option>
                      <option value="section3">Section 3</option>
                      <option value="section4">Section 4</option>
                      <option value="section5">Section 5</option>
                      <option value="total">Total</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">New Value</label>
                    <input
                      type="number"
                      value={editMarksData.newValue || ""}
                      onChange={(e) => setEditMarksData({ ...editMarksData, newValue: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Reason</label>
                    <input
                      type="text"
                      value={editMarksData.reason || ""}
                      onChange={(e) => setEditMarksData({ ...editMarksData, reason: e.target.value })}
                      placeholder="Reason for change"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={editStudentMarks}
                  disabled={loading || !editMarksData.rollNo || !editMarksData.field}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} /> Update Marks
                </button>
              </div>

              {/* Manual Rank */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown size={20} /> Set Manual Rank
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={manualRankData.rollNo}
                      onChange={(e) => setManualRankData({ ...manualRankData, rollNo: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Rank Type</label>
                    <select
                      value={manualRankData.rankType}
                      onChange={(e) => setManualRankData({ ...manualRankData, rankType: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {rankTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Rank Value</label>
                    <input
                      type="number"
                      min="1"
                      value={manualRankData.rankValue}
                      onChange={(e) => setManualRankData({ ...manualRankData, rankValue: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={setManualRank}
                  disabled={loading || !manualRankData.rollNo}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Crown size={16} /> Set Rank
                </button>
              </div>

              {/* Joint Rank */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users size={20} /> Assign Joint Rank
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm text-gray-600 mb-1">Roll Numbers (comma-separated)</label>
                    <input
                      type="text"
                      value={jointRankData.rollNumbers}
                      onChange={(e) => setJointRankData({ ...jointRankData, rollNumbers: e.target.value })}
                      placeholder="e.g., ROLL001, ROLL002, ROLL003"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Rank Type</label>
                    <select
                      value={jointRankData.rankType}
                      onChange={(e) => setJointRankData({ ...jointRankData, rankType: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {rankTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Joint Rank Value</label>
                    <input
                      type="number"
                      min="1"
                      value={jointRankData.rankValue}
                      onChange={(e) => setJointRankData({ ...jointRankData, rankValue: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={assignJointRank}
                  disabled={loading || !jointRankData.rollNumbers}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Users size={16} /> Assign Joint Rank
                </button>
              </div>
            </div>
          )}

          {/* Result Workflow Tab */}
          {activeTab === "workflow" && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lock size={20} /> Result Workflow
                </h3>

                {workflowStatus ? (
                  <div className="space-y-6">
                    {/* Status Pipeline */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {["draft", "review", "approved", "locked"].map((status, idx) => (
                        <React.Fragment key={status}>
                          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                            workflowStatus.currentStatus === status
                              ? statusColors[status] + " ring-2 ring-offset-2 ring-blue-400"
                              : "bg-gray-50 text-gray-400"
                          }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                          {idx < 3 && <ArrowRight size={16} className="text-gray-300" />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Current Status Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[workflowStatus.currentStatus]}`}>
                          {workflowStatus.currentStatus?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          Published: {workflowStatus.isPublished ? "Yes" : "No"} |
                          Locked: {workflowStatus.isLocked ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {workflowStatus.currentStatus === "draft" && (
                        <button onClick={() => changeWorkflowStatus("review")} disabled={loading}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                          Move to Review
                        </button>
                      )}
                      {workflowStatus.currentStatus === "review" && (
                        <>
                          <button onClick={() => changeWorkflowStatus("draft")} disabled={loading}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50">
                            Back to Draft
                          </button>
                          <button onClick={() => changeWorkflowStatus("approved")} disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                            Approve
                          </button>
                        </>
                      )}
                      {workflowStatus.currentStatus === "approved" && (
                        <>
                          <button onClick={() => changeWorkflowStatus("review")} disabled={loading}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50">
                            Back to Review
                          </button>
                          <button onClick={() => changeWorkflowStatus("locked")} disabled={loading}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                            <Lock size={16} className="inline mr-1" /> Lock & Publish
                          </button>
                        </>
                      )}
                      {workflowStatus.currentStatus === "locked" && (
                        <button onClick={unlockResults} disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                          <Unlock size={16} /> Unlock (Superadmin Only)
                        </button>
                      )}
                    </div>

                    {/* Status History */}
                    {workflowStatus.statusHistory && workflowStatus.statusHistory.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 text-sm text-gray-700">Status History</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {workflowStatus.statusHistory.slice().reverse().map((entry, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[entry.status]}`}>
                                {entry.status}
                              </span>
                              <span className="text-gray-500">
                                {new Date(entry.changedAt).toLocaleString()}
                              </span>
                              <span className="text-gray-400">by {entry.changedBy || "system"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">{loading ? "Loading workflow status..." : "No workflow data found for this subject/batch."}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RankingManagement;
