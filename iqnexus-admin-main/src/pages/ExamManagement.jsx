import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import { BASE_URL } from "../Api";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Default exam structure
  const defaultExam = {
    subject: "",
    examName: "",
    classLevel: "all",
    batchId: "2024-25",
    topicCount: 5,
    topicNames: {
      section1: "",
      section2: "",
      section3: "",
      section4: "",
      section5: "",
    },
    rankVisibility: {
      schoolRank: true,
      zonalRank: true,
      nationalRank: true,
      internationalRank: true,
      classRank: true,
      sectionRank: true,
    },
    isPublished: false,
  };

  const [newExam, setNewExam] = useState(defaultExam);

  // Predefined exam options
  const examOptions = [
    { value: "IQMOL1", label: "IQMO Level 1 (Mathematics)", name: "Mathematics Olympiad L1" },
    { value: "IQMOL2", label: "IQMO Level 2 (Mathematics)", name: "Mathematics Olympiad L2" },
    { value: "IQROL1", label: "IQRO Level 1 (Reasoning)", name: "Reasoning Olympiad L1" },
    { value: "IQROL2", label: "IQRO Level 2 (Reasoning)", name: "Reasoning Olympiad L2" },
    { value: "IQSOL1", label: "IQSO Level 1 (Science)", name: "Science Olympiad L1" },
    { value: "IQSOL2", label: "IQSO Level 2 (Science)", name: "Science Olympiad L2" },
    { value: "IQEOL1", label: "IQEO Level 1 (English)", name: "English Olympiad L1" },
    { value: "IQEOL2", label: "IQEO Level 2 (English)", name: "English Olympiad L2" },
    { value: "IQGKOL1", label: "IQGKO Level 1 (GK)", name: "GK Olympiad L1" },
    { value: "IQGKOL2", label: "IQGKO Level 2 (GK)", name: "GK Olympiad L2" },
  ];

  // Fetch all exam configs
  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/result-configs`);
      if (res.data.success) {
        setExams(res.data.configs || []);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      setMessage({ type: "error", text: "Failed to fetch exams" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Save exam configuration
  const saveExam = async (examData) => {
    setSaving(true);
    try {
      const res = await axios.post(`${BASE_URL}/result-config`, examData);
      if (res.data.success) {
        setMessage({ type: "success", text: "Exam configuration saved successfully!" });
        fetchExams();
        setEditingExam(null);
        setShowAddModal(false);
        setNewExam(defaultExam);
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      setMessage({ type: "error", text: "Failed to save exam configuration" });
    } finally {
      setSaving(false);
    }
  };

  // Delete exam configuration
  const deleteExam = async (subject, classLevel) => {
    if (!confirm("Are you sure you want to delete this exam configuration?")) return;
    
    try {
      const res = await axios.delete(`${BASE_URL}/result-config`, {
        data: { subject, classLevel }
      });
      if (res.data.success) {
        setMessage({ type: "success", text: "Exam configuration deleted!" });
        fetchExams();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      setMessage({ type: "error", text: "Failed to delete exam configuration" });
    }
  };

  // Filter exams based on search
  const filteredExams = exams.filter(exam => 
    exam.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    examOptions.find(o => o.value === exam.subject)?.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get topic count from topicNames
  const getTopicCount = (topicNames) => {
    if (!topicNames) return 5;
    return Object.values(topicNames).filter(name => name && name.trim() !== "").length || 5;
  };

  // Render topic inputs
  const renderTopicInputs = (exam, isEditing, onChange) => {
    const topicCount = exam.topicCount || 5;
    const topics = [];
    
    for (let i = 1; i <= topicCount; i++) {
      topics.push(
        <div key={i} className="flex items-center gap-3 mb-2">
          <label className="w-24 text-sm font-medium text-gray-600">
            Section {i}:
          </label>
          <input
            type="text"
            value={exam.topicNames?.[`section${i}`] || ""}
            onChange={(e) => onChange(`section${i}`, e.target.value)}
            disabled={!isEditing}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
              isEditing 
                ? "border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                : "border-gray-200 bg-gray-50"
            }`}
            placeholder={`Enter topic name for Section ${i}`}
          />
        </div>
      );
    }
    return topics;
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen size={28} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
                <p className="text-gray-500 text-sm">Configure topics and settings for each exam</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              Add Exam Config
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading exams...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No exam configurations found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-purple-600 hover:underline"
            >
              Add your first exam configuration
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const examInfo = examOptions.find(o => o.value === exam.subject);
              const isExpanded = expandedExam === exam._id;
              const isEditing = editingExam === exam._id;

              return (
                <div key={exam._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Exam Header */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedExam(isExpanded ? null : exam._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${exam.isPublished ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <BookOpen size={20} className={exam.isPublished ? 'text-green-600' : 'text-gray-500'} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {examInfo?.label || exam.subject}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getTopicCount(exam.topicNames)} topics configured • 
                          Class: {exam.classLevel === "all" ? "All Classes" : `Class ${exam.classLevel}`} • 
                          {exam.isPublished ? (
                            <span className="text-green-600"> Published</span>
                          ) : (
                            <span className="text-orange-500"> Draft</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingExam(isEditing ? null : exam._id);
                          setExpandedExam(exam._id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isEditing ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExam(exam.subject, exam.classLevel);
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Topic Names */}
                        <div>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <Target size={16} className="text-purple-500" />
                            TOPIC NAMES (Section-wise)
                          </h4>
                          
                          {isEditing && (
                            <div className="mb-4">
                              <label className="text-sm text-gray-600 mb-1 block">Number of Topics:</label>
                              <select
                                value={exam.topicCount || 5}
                                onChange={(e) => {
                                  const updated = { ...exam, topicCount: parseInt(e.target.value) };
                                  setExams(exams.map(ex => ex._id === exam._id ? updated : ex));
                                }}
                                className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                  <option key={n} value={n}>{n} Topics</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {renderTopicInputs(
                            exam,
                            isEditing,
                            (key, value) => {
                              const updated = {
                                ...exam,
                                topicNames: { ...exam.topicNames, [key]: value }
                              };
                              setExams(exams.map(ex => ex._id === exam._id ? updated : ex));
                            }
                          )}
                        </div>

                        {/* Rank Visibility */}
                        <div>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <Eye size={16} className="text-blue-500" />
                            RANK VISIBILITY
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "schoolRank", label: "School Rank" },
                              { key: "classRank", label: "Class Rank" },
                              { key: "sectionRank", label: "Section Rank" },
                              { key: "zonalRank", label: "City/Zonal Rank" },
                              { key: "nationalRank", label: "National Rank" },
                              { key: "internationalRank", label: "International Rank" },
                            ].map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => {
                                  if (!isEditing) return;
                                  const updated = {
                                    ...exam,
                                    rankVisibility: {
                                      ...exam.rankVisibility,
                                      [key]: !exam.rankVisibility?.[key]
                                    }
                                  };
                                  setExams(exams.map(ex => ex._id === exam._id ? updated : ex));
                                }}
                                disabled={!isEditing}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                                  exam.rankVisibility?.[key]
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 bg-gray-50 text-gray-500"
                                } ${isEditing ? "cursor-pointer hover:border-blue-400" : "cursor-default"}`}
                              >
                                {exam.rankVisibility?.[key] ? (
                                  <Eye size={14} className="text-blue-500" />
                                ) : (
                                  <EyeOff size={14} className="text-gray-400" />
                                )}
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      {isEditing && (
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={() => setEditingExam(null)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveExam(exam)}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Exam Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Add Exam Configuration</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewExam(defaultExam);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Exam Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Exam
                  </label>
                  <select
                    value={newExam.subject}
                    onChange={(e) => {
                      const selected = examOptions.find(o => o.value === e.target.value);
                      setNewExam({
                        ...newExam,
                        subject: e.target.value,
                        examName: selected?.name || ""
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select Exam --</option>
                    {examOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Class Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Level
                  </label>
                  <select
                    value={newExam.classLevel}
                    onChange={(e) => setNewExam({ ...newExam, classLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Classes (Universal Config)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => (
                      <option key={c} value={String(c)}>Class {c}</option>
                    ))}
                  </select>
                </div>

                {/* Number of Topics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Topics/Sections
                  </label>
                  <select
                    value={newExam.topicCount}
                    onChange={(e) => setNewExam({ ...newExam, topicCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} Topics</option>
                    ))}
                  </select>
                </div>

                {/* Topic Names */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Names
                  </label>
                  <div className="space-y-2">
                    {Array.from({ length: newExam.topicCount }, (_, i) => i + 1).map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <label className="w-24 text-sm text-gray-600">Section {i}:</label>
                        <input
                          type="text"
                          value={newExam.topicNames[`section${i}`] || ""}
                          onChange={(e) => setNewExam({
                            ...newExam,
                            topicNames: { ...newExam.topicNames, [`section${i}`]: e.target.value }
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder={`Enter topic name for Section ${i}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rank Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rank Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "schoolRank", label: "School Rank" },
                      { key: "classRank", label: "Class Rank" },
                      { key: "sectionRank", label: "Section Rank" },
                      { key: "zonalRank", label: "City/Zonal Rank" },
                      { key: "nationalRank", label: "National Rank" },
                      { key: "internationalRank", label: "International Rank" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewExam({
                          ...newExam,
                          rankVisibility: {
                            ...newExam.rankVisibility,
                            [key]: !newExam.rankVisibility[key]
                          }
                        })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                          newExam.rankVisibility[key]
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {newExam.rankVisibility[key] ? (
                          <Eye size={14} className="text-blue-500" />
                        ) : (
                          <EyeOff size={14} className="text-gray-400" />
                        )}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewExam(defaultExam);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveExam(newExam)}
                  disabled={!newExam.subject || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamManagement;
