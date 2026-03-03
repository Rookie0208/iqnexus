import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Trophy,
  Plus,
  Trash2,
  Save,
  Copy,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { BASE_URL } from "../Api";

/* ──────────────────── constants ──────────────────── */
const examOptions = [
  { value: "IQMOL1", label: "IQMO L1 (Maths)" },
  { value: "IQMOL2", label: "IQMO L2 (Maths)" },
  { value: "IQROL1", label: "IQRO L1 (Reasoning)" },
  { value: "IQROL2", label: "IQRO L2 (Reasoning)" },
  { value: "IQSOL1", label: "IQSO L1 (Science)" },
  { value: "IQSOL2", label: "IQSO L2 (Science)" },
  { value: "IQEOL1", label: "IQEO L1 (English)" },
  { value: "IQEOL2", label: "IQEO L2 (English)" },
  { value: "IQGKOL1", label: "IQGKO L1 (GK)" },
  { value: "IQGKOL2", label: "IQGKO L2 (GK)" },
  { value: "IQKD1", label: "IQKD1 (KG Exam 1)" },
  { value: "IQKD2", label: "IQKD2 (KG Exam 2)" },
];

const classOptions = [
  { value: "all", label: "All Classes" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Class ${i + 1}`,
  })),
  { value: "KG", label: "KG" },
];

const levelOptions = [
  { value: "basic", label: "Basic Level" },
  { value: "advance", label: "Advance Level" },
];

const categoryOptions = [
  "NATIONALITY",
  "COUNTRY",
  "CITY",
  "SCHOOL",
  "CLASS",
  "SECTION",
  "all",
];

const emptyRule = {
  priority: 0,
  prizeType: "",
  isTopperCategory: true,
  category: "all",
  show: true,
  totalPrizes: 0,
  excludeHigherPrizeWinners: true,
};

/* ──────────────────── component ──────────────────── */
const PrizeConfiguration = () => {
  // Filters
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("basic");

  // Data
  const [config, setConfig] = useState(null);
  const [rules, setRules] = useState([]);
  const [excludeHigherWinners, setExcludeHigherWinners] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Clone modal
  const [showClone, setShowClone] = useState(false);
  const [cloneTarget, setCloneTarget] = useState({ exam: "", classLevel: "all", level: "basic" });

  /* ─── fetch ─── */
  const fetchConfig = useCallback(async () => {
    if (!selectedExam) return;
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await axios.get(`${BASE_URL}/prize-config`, {
        params: {
          exam: selectedExam,
          classLevel: selectedClass,
          level: selectedLevel,
        },
      });
      if (res.data.success && res.data.config) {
        setConfig(res.data.config);
        setRules(res.data.config.prizeRules || []);
        setExcludeHigherWinners(res.data.config.excludeHigherWinners ?? true);
      } else {
        setConfig(null);
        setRules([]);
        setExcludeHigherWinners(true);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch prize config" });
    } finally {
      setLoading(false);
    }
  }, [selectedExam, selectedClass, selectedLevel]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  /* ─── save ─── */
  const handleSave = async () => {
    if (!selectedExam) {
      setMessage({ type: "error", text: "Please select an exam first" });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      // Re-assign priorities based on array order
      const ordered = rules.map((r, i) => ({ ...r, priority: i + 1 }));

      const res = await axios.post(`${BASE_URL}/prize-config`, {
        exam: selectedExam,
        classLevel: selectedClass,
        level: selectedLevel,
        prizeRules: ordered,
        excludeHigherWinners,
      });
      if (res.data.success) {
        setConfig(res.data.config);
        setRules(res.data.config.prizeRules);
        setMessage({ type: "success", text: "Prize configuration saved!" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to save prize configuration" });
    } finally {
      setSaving(false);
    }
  };

  /* ─── create new with defaults ─── */
  const handleCreateDefault = async () => {
    if (!selectedExam) {
      setMessage({ type: "error", text: "Please select an exam first" });
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${BASE_URL}/prize-config`, {
        exam: selectedExam,
        classLevel: selectedClass,
        level: selectedLevel,
        prizeRules: [],
        excludeHigherWinners: true,
      });
      if (res.data.success) {
        setConfig(res.data.config);
        setRules(res.data.config.prizeRules);
        setExcludeHigherWinners(res.data.config.excludeHigherWinners ?? true);
        setMessage({ type: "success", text: "Created with default prize rules!" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to create config" });
    } finally {
      setSaving(false);
    }
  };

  /* ─── clone ─── */
  const handleClone = async () => {
    if (!selectedExam || !cloneTarget.exam) return;
    try {
      const res = await axios.post(`${BASE_URL}/prize-config/clone`, {
        sourceExam: selectedExam,
        sourceClassLevel: selectedClass,
        sourceLevel: selectedLevel,
        targetExam: cloneTarget.exam,
        targetClassLevel: cloneTarget.classLevel,
        targetLevel: cloneTarget.level,
      });
      if (res.data.success) {
        setMessage({ type: "success", text: `Cloned to ${cloneTarget.exam} / ${cloneTarget.classLevel}` });
        setShowClone(false);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Clone failed" });
    }
  };

  /* ─── rule manipulation ─── */
  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { ...emptyRule, priority: prev.length + 1 },
    ]);
  };

  const removeRule = (idx) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveRule = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= rules.length) return;
    const copy = [...rules];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setRules(copy);
  };

  const updateRule = (idx, field, value) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  /* ─── delete config ─── */
  const handleDelete = async () => {
    if (!config?._id) return;
    if (!window.confirm("Delete this entire prize configuration?")) return;
    try {
      await axios.delete(`${BASE_URL}/prize-config/${config._id}`);
      setConfig(null);
      setRules([]);
      setMessage({ type: "success", text: "Configuration deleted" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to delete" });
    }
  };

  /* ──────────────────── render ──────────────────── */
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Prize Configuration</h1>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Exam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam / Subject</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">-- Select Exam --</option>
              {examOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {levelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      )}

      {/* No config exists – offer creation */}
      {!loading && selectedExam && !config && (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <Trophy className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500 mb-4">
            No prize configuration found for <strong>{selectedExam}</strong> / Class{" "}
            <strong>{selectedClass}</strong> / <strong>{selectedLevel}</strong>.
          </p>
          <button
            onClick={handleCreateDefault}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create with Default Rules"}
          </button>
        </div>
      )}

      {/* ── Config editor ── */}
      {!loading && config && (
        <>
          {/* Global settings bar */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={excludeHigherWinners}
                onChange={(e) => setExcludeHigherWinners(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              Exclude higher-prize winners from lower prizes
            </label>

            <div className="ml-auto flex gap-2 flex-wrap">
              <button
                onClick={() => setShowClone(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy size={14} /> Clone Config
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                {saving ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* Prize rules table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-gray-600">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-600 min-w-[280px]">
                      Prize Type
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-600">Topper?</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-600">Category</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-600">Show</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">
                      Total Prizes
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => (
                    <tr
                      key={rule._id || idx}
                      className={`border-b hover:bg-blue-50/50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      {/* Priority # */}
                      <td className="px-3 py-2 text-center font-medium text-gray-500">
                        {idx + 1}
                      </td>

                      {/* Prize type */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={rule.prizeType}
                          onChange={(e) => updateRule(idx, "prizeType", e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-300 outline-none"
                          placeholder="e.g. GOLD MEDAL;CERTIFICATE"
                        />
                      </td>

                      {/* isTopperCategory */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={rule.isTopperCategory}
                          onChange={(e) =>
                            updateRule(idx, "isTopperCategory", e.target.checked)
                          }
                          className="w-4 h-4 rounded text-blue-600"
                        />
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2">
                        <select
                          value={rule.category}
                          onChange={(e) => updateRule(idx, "category", e.target.value)}
                          className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-300 outline-none"
                        >
                          {categoryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Show */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={rule.show}
                          onChange={(e) => updateRule(idx, "show", e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                      </td>

                      {/* Total Prizes */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={rule.totalPrizes}
                          onChange={(e) =>
                            updateRule(idx, "totalPrizes", Number(e.target.value))
                          }
                          className="w-20 border rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-blue-300 outline-none"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveRule(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveRule(idx, 1)}
                            disabled={idx === rules.length - 1}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => removeRule(idx)}
                            className="p-1 rounded hover:bg-red-100 text-red-500"
                            title="Remove rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No prize rules. Click &quot;Add Rule&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add rule button */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={addRule}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={16} /> Add Rule
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p>
              <strong>Priority:</strong> Row order = priority. Higher-priority (top) prizes are
              awarded first. Students who receive a prize are excluded from lower
              ones when &quot;Exclude higher-prize winners&quot; is enabled.
            </p>
            <p>
              <strong>Category:</strong> The scope within which the prize is
              distributed — NATIONALITY (international), COUNTRY (national), CITY
              (zonal), SCHOOL, CLASS, SECTION, or &quot;all&quot; (everyone).
            </p>
            <p>
              <strong>Total Prizes:</strong> Number of prizes to give within
              each group of the selected category. Ranks are auto-calculated from
              results. e.g. Category = SECTION &amp; Total = 5 means the top 5
              students per section get this prize. 0 = everyone in scope qualifies.
            </p>
          </div>
        </>
      )}

      {/* ── Clone modal ── */}
      {showClone && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Clone Configuration</h3>
            <p className="text-sm text-gray-500 mb-4">
              Copy rules from <strong>{selectedExam}</strong> / {selectedClass} /{" "}
              {selectedLevel} to another exam/class.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Exam
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={cloneTarget.exam}
                  onChange={(e) =>
                    setCloneTarget((p) => ({ ...p, exam: e.target.value }))
                  }
                >
                  <option value="">-- Select --</option>
                  {examOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Class
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={cloneTarget.classLevel}
                  onChange={(e) =>
                    setCloneTarget((p) => ({ ...p, classLevel: e.target.value }))
                  }
                >
                  {classOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Level
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={cloneTarget.level}
                  onChange={(e) =>
                    setCloneTarget((p) => ({ ...p, level: e.target.value }))
                  }
                >
                  {levelOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowClone(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={!cloneTarget.exam}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeConfiguration;
