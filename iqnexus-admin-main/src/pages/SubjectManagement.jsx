import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen, Plus, Edit2, Trash2, Save, X, Search,
  ChevronDown, ChevronUp, Settings, Target, AlertCircle, CheckCircle,
  Layers, Award, BarChart3
} from "lucide-react";
import { BASE_URL } from "../Api";

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterLevel, setFilterLevel] = useState("");

  const defaultSubject = {
    code: "",
    name: "",
    label: "",
    category: "",
    examLevel: "L1",
    resultFieldKey: "",
    registrationField: "",
    paperStructure: {
      totalSections: 5,
      sectionNames: ["Section 1", "Section 2", "Section 3", "Section 4", "Section 5"],
      totalQuestions: 50,
      totalMarks: 100,
      duration: 60,
      negativeMarking: false,
      negativeMarkValue: 0,
    },
    qualificationRules: {
      qualifyingPercentage: 40,
      qualifiesForLevel2: true,
    },
    tieBreakOrder: ["totalMarks", "achieversSection", "higherDifficulty", "level1Marks", "age"],
    achieversSectionIndex: 5,
    higherDifficultyIndex: 4,
    linkedLevel1Subject: "",
    displayOrder: 0,
  };

  const [newSubject, setNewSubject] = useState(defaultSubject);

  const categories = [
    "Mathematics", "Science", "English", "Reasoning",
    "General Knowledge", "Computer", "AI", "Coding",
    "Social Science", "Hindi", "Kindergarten", "Other"
  ];

  const tieBreakOptions = [
    { value: "totalMarks", label: "Total Marks" },
    { value: "achieversSection", label: "Achievers Section Score" },
    { value: "higherDifficulty", label: "Higher Difficulty Questions" },
    { value: "level1Marks", label: "Level-1 Marks (for L2)" },
    { value: "age", label: "Age (Younger Preferred)" },
  ];

  // Fetch subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/subjects`, {
        params: { activeOnly: "true", examLevel: filterLevel || undefined }
      });
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setMessage({ type: "error", text: "Failed to load subjects" });
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSubjects(); }, [filterLevel]);

  // Save subject (create or update)
  const saveSubject = async (subjectData, isEdit = false) => {
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`${BASE_URL}/subjects/${subjectData.code}`, subjectData);
        setMessage({ type: "success", text: `Subject '${subjectData.code}' updated` });
      } else {
        await axios.post(`${BASE_URL}/subjects`, subjectData);
        setMessage({ type: "success", text: `Subject '${subjectData.code}' created` });
      }
      fetchSubjects();
      setShowAddModal(false);
      setEditingSubject(null);
      setNewSubject(defaultSubject);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to save subject" });
    }
    setSaving(false);
  };

  // Delete subject
  const deleteSubject = async (code) => {
    if (!confirm(`Deactivate subject ${code}?`)) return;
    try {
      await axios.delete(`${BASE_URL}/subjects/${code}`);
      setMessage({ type: "success", text: `Subject '${code}' deactivated` });
      fetchSubjects();
    } catch {
      setMessage({ type: "error", text: "Failed to delete subject" });
    }
  };

  // Update tie-break order
  const saveTieBreak = async (code, tieBreakOrder, achieversSectionIndex, higherDifficultyIndex) => {
    try {
      await axios.put(`${BASE_URL}/subjects/${code}/tie-break`, {
        tieBreakOrder, achieversSectionIndex, higherDifficultyIndex
      });
      setMessage({ type: "success", text: "Tie-break order updated" });
      fetchSubjects();
    } catch {
      setMessage({ type: "error", text: "Failed to update tie-break order" });
    }
  };

  // Update qualification rules
  const saveQualification = async (code, qualifyingPercentage) => {
    try {
      await axios.put(`${BASE_URL}/subjects/${code}/qualification`, { qualifyingPercentage });
      setMessage({ type: "success", text: "Qualification settings updated" });
      fetchSubjects();
    } catch {
      setMessage({ type: "error", text: "Failed to update qualification settings" });
    }
  };

  // Filtered subjects
  const filtered = subjects.filter(s =>
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Move tie-break item up/down
  const moveTieBreak = (subject, index, direction) => {
    const order = [...(subject.tieBreakOrder || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    saveTieBreak(subject.code, order, subject.achieversSectionIndex, subject.higherDifficultyIndex);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, or remove subjects dynamically</p>
        </div>
        <button
          onClick={() => { setNewSubject(defaultSubject); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {/* Status message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage({ type: "", text: "" })} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Levels</option>
          <option value="L1">Level 1</option>
          <option value="L2">Level 2</option>
        </select>
      </div>

      {/* Subject Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading subjects...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(subject => (
            <div key={subject.code} className="bg-white border rounded-lg shadow-sm">
              {/* Subject Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSubject(expandedSubject === subject.code ? null : subject.code)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${subject.examLevel === "L1" ? "bg-blue-100" : "bg-purple-100"}`}>
                    <BookOpen size={20} className={subject.examLevel === "L1" ? "text-blue-600" : "text-purple-600"} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{subject.name}</h3>
                    <div className="flex gap-2 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{subject.code}</span>
                      <span className={`px-2 py-0.5 rounded ${subject.examLevel === "L1" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {subject.examLevel === "L1" ? "Level 1" : "Level 2"}
                      </span>
                      <span className="bg-gray-50 px-2 py-0.5 rounded">{subject.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    Qualify: {subject.qualificationRules?.qualifyingPercentage || 40}%
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingSubject(subject); setNewSubject(subject); setShowAddModal(true); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSubject(subject.code); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedSubject === subject.code ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSubject === subject.code && (
                <div className="border-t px-4 py-4 space-y-6">
                  {/* Paper Structure */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Layers size={16} /> Paper Structure
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500">Sections</div>
                        <div className="font-semibold">{subject.paperStructure?.totalSections || 5}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500">Total Questions</div>
                        <div className="font-semibold">{subject.paperStructure?.totalQuestions || 50}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500">Total Marks</div>
                        <div className="font-semibold">{subject.paperStructure?.totalMarks || 100}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="font-semibold">{subject.paperStructure?.duration || 60} min</div>
                      </div>
                    </div>
                  </div>

                  {/* Qualification Settings */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Target size={16} /> Qualification Settings
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Qualifying %:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={subject.qualificationRules?.qualifyingPercentage || 40}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val >= 0 && val <= 100) {
                              saveQualification(subject.code, val);
                            }
                          }}
                          className="w-20 border rounded px-2 py-1 text-center"
                        />
                      </div>
                      {subject.examLevel === "L1" && (
                        <span className="text-sm text-green-600">
                          ✓ Qualifies for Level 2
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tie-Break Order */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <BarChart3 size={16} /> Tie-Break Order (drag to reorder)
                    </h4>
                    <div className="space-y-1">
                      {(subject.tieBreakOrder || []).map((criterion, idx) => (
                        <div key={criterion} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <span className="w-6 text-center text-sm font-semibold text-gray-400">{idx + 1}</span>
                          <span className="flex-1 text-sm">
                            {tieBreakOptions.find(o => o.value === criterion)?.label || criterion}
                          </span>
                          <button
                            onClick={() => moveTieBreak(subject, idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveTieBreak(subject, idx, 1)}
                            disabled={idx === (subject.tieBreakOrder || []).length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      <span>Achievers Section: Section {subject.achieversSectionIndex || 5}</span>
                      <span>Higher Difficulty: Section {subject.higherDifficultyIndex || 4}</span>
                    </div>
                  </div>

                  {/* Technical Info */}
                  <div className="text-xs text-gray-400 flex gap-4">
                    <span>Result Field: {subject.resultFieldKey}</span>
                    <span>Registration Field: {subject.registrationField || "N/A"}</span>
                    {subject.linkedLevel1Subject && <span>Linked L1: {subject.linkedLevel1Subject}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingSubject ? "Edit Subject" : "Add New Subject"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingSubject(null); setNewSubject(defaultSubject); }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                    disabled={!!editingSubject}
                    placeholder="e.g., IQCOL1"
                    className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Level *</label>
                  <select
                    value={newSubject.examLevel}
                    onChange={(e) => setNewSubject({ ...newSubject, examLevel: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="L1">Level 1</option>
                    <option value="L2">Level 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g., Coding Olympiad Level 1"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Label *</label>
                  <input
                    type="text"
                    value={newSubject.label}
                    onChange={(e) => setNewSubject({ ...newSubject, label: e.target.value })}
                    placeholder="e.g., IQCO L1"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newSubject.category}
                    onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Paper Structure */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Paper Structure</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sections</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newSubject.paperStructure?.totalSections || 5}
                      onChange={(e) => setNewSubject({
                        ...newSubject,
                        paperStructure: { ...newSubject.paperStructure, totalSections: Number(e.target.value) }
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Total Questions</label>
                    <input
                      type="number"
                      value={newSubject.paperStructure?.totalQuestions || 50}
                      onChange={(e) => setNewSubject({
                        ...newSubject,
                        paperStructure: { ...newSubject.paperStructure, totalQuestions: Number(e.target.value) }
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={newSubject.paperStructure?.totalMarks || 100}
                      onChange={(e) => setNewSubject({
                        ...newSubject,
                        paperStructure: { ...newSubject.paperStructure, totalMarks: Number(e.target.value) }
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Qualification */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Qualification Rules</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Qualifying Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newSubject.qualificationRules?.qualifyingPercentage || 40}
                      onChange={(e) => setNewSubject({
                        ...newSubject,
                        qualificationRules: { ...newSubject.qualificationRules, qualifyingPercentage: Number(e.target.value) }
                      })}
                      className="w-24 border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Fields */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Technical Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Result Field Key</label>
                    <input
                      type="text"
                      value={newSubject.resultFieldKey}
                      onChange={(e) => setNewSubject({ ...newSubject, resultFieldKey: e.target.value })}
                      placeholder="e.g., ICOL1"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  {newSubject.examLevel === "L2" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Linked Level-1 Subject Code</label>
                      <input
                        type="text"
                        value={newSubject.linkedLevel1Subject}
                        onChange={(e) => setNewSubject({ ...newSubject, linkedLevel1Subject: e.target.value.toUpperCase() })}
                        placeholder="e.g., IQCOL1"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button
                onClick={() => { setShowAddModal(false); setEditingSubject(null); setNewSubject(defaultSubject); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveSubject(newSubject, !!editingSubject)}
                disabled={saving || !newSubject.code || !newSubject.name || !newSubject.label || !newSubject.category}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : (editingSubject ? "Update" : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
