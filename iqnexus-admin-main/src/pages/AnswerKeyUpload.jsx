import React, { useState } from "react";
import Select from "react-select";
import { BASE_URL } from "../Api";

const DEFAULT_PATTERNS = {
  NURSERY: {
    totalQuestions: 20,
    sections: [
      { index: 1, from: 1, to: 15, marksPerQuestion: 1, label: "General", isAchiever: false },
      { index: 2, from: 16, to: 20, marksPerQuestion: 2, label: "Achiever", isAchiever: true },
    ],
  },
  LKG: {
    totalQuestions: 25,
    sections: [
      { index: 1, from: 1, to: 20, marksPerQuestion: 1, label: "General", isAchiever: false },
      { index: 2, from: 21, to: 25, marksPerQuestion: 2, label: "Achiever", isAchiever: true },
    ],
  },
  UKG: {
    totalQuestions: 30,
    sections: [
      { index: 1, from: 1, to: 25, marksPerQuestion: 1, label: "General", isAchiever: false },
      { index: 2, from: 26, to: 30, marksPerQuestion: 2, label: "Achiever", isAchiever: true },
    ],
  },
};

const emptySection = (index = 1) => ({
  index,
  from: 1,
  to: 1,
  marksPerQuestion: 1,
  label: `Section ${index}`,
  isAchiever: false,
});

const AnswerKeyUpload = () => {
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedExamLevel, setSelectedExamLevel] = useState("");
  const [isKGExam, setIsKGExam] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [questionsCount, setQuestionsCount] = useState(30);
  const [answers, setAnswers] = useState({});
  const [scoringPattern, setScoringPattern] = useState(null);

  const exams = [
    { name: "IQEOL1", level: "L1" },
    { name: "IQEOL2", level: "L2" },
    { name: "IQROL1", level: "L1" },
    { name: "IQROL2", level: "L2" },
    { name: "IQSOL1", level: "L1" },
    { name: "IQSOL2", level: "L2" },
    { name: "IQMOL1", level: "L1" },
    { name: "IQMOL2", level: "L2" },
    { name: "IQGKOL1", level: "L1" },
    { name: "IQKD1", level: "L1", isKG: true, label: "IQKG1 (IQKD1)" },
    { name: "IQKD2", level: "L2", isKG: true, label: "IQKG2 / IQKGL2 (IQKD2)" },
  ];

  const trimAnswersToCount = (count, prev) => {
    const next = {};
    for (let i = 0; i < count; i++) {
      if (prev[i] !== undefined) next[i] = prev[i];
    }
    return next;
  };

  const applyKgDefaults = (classValue) => {
    const pattern = DEFAULT_PATTERNS[classValue] || DEFAULT_PATTERNS.UKG;
    const cloned = {
      totalQuestions: pattern.totalQuestions,
      sections: pattern.sections.map((s) => ({ ...s })),
    };
    setScoringPattern(cloned);
    setQuestionsCount(cloned.totalQuestions);
    setAnswers((prev) => trimAnswersToCount(cloned.totalQuestions, prev));
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const addMoreQuestions = () => {
    setQuestionsCount((prev) => {
      const next = prev + 5;
      if (isKGExam && scoringPattern) {
        setScoringPattern((p) => (p ? { ...p, totalQuestions: next } : p));
      }
      return next;
    });
  };

  const updatePatternField = (field, value) => {
    setScoringPattern((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === "totalQuestions") {
        const n = Number(value) || 1;
        setQuestionsCount(n);
        setAnswers((a) => trimAnswersToCount(n, a));
        next.totalQuestions = n;
      }
      return next;
    });
  };

  const updateSection = (idx, field, value) => {
    setScoringPattern((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== idx) {
          // Only one achiever allowed
          if (field === "isAchiever" && value === true) {
            return { ...s, isAchiever: false };
          }
          return s;
        }
        let v = value;
        if (["index", "from", "to", "marksPerQuestion"].includes(field)) {
          v = value === "" ? "" : Number(value);
        }
        if (field === "isAchiever") v = Boolean(value);
        return { ...s, [field]: v };
      });
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setScoringPattern((prev) => {
      if (!prev) return prev;
      const nextIndex =
        Math.max(0, ...prev.sections.map((s) => Number(s.index) || 0)) + 1;
      return {
        ...prev,
        sections: [...prev.sections, emptySection(nextIndex)],
      };
    });
  };

  const removeSection = (idx) => {
    setScoringPattern((prev) => {
      if (!prev || prev.sections.length <= 1) return prev;
      return {
        ...prev,
        sections: prev.sections.filter((_, i) => i !== idx),
      };
    });
  };

  const validatePatternClient = (pattern) => {
    if (!pattern?.sections?.length) return "Add at least one scoring section";
    const total = Number(pattern.totalQuestions);
    if (!Number.isFinite(total) || total < 1) return "Total questions must be >= 1";
    const covered = new Set();
    for (const s of pattern.sections) {
      const from = Number(s.from);
      const to = Number(s.to);
      const marks = Number(s.marksPerQuestion);
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
        return `Invalid from/to on section ${s.index}`;
      }
      if (to > total) return `Section ${s.index} ends after total questions`;
      if (!Number.isFinite(marks) || marks <= 0) {
        return `Marks must be > 0 on section ${s.index}`;
      }
      for (let q = from; q <= to; q++) {
        if (covered.has(q)) return `Question ${q} is in more than one section`;
        covered.add(q);
      }
    }
    for (let q = 1; q <= total; q++) {
      if (!covered.has(q)) return `Question ${q} is not covered by any section`;
    }
    const achievers = pattern.sections.filter((s) => s.isAchiever);
    if (achievers.length > 1) return "Only one section can be marked Achiever";
    return null;
  };

  const handleSaveAnswers = async () => {
    if (!selectedExamLevel || !selectedExam?.value || !selectedClass) {
      alert("Please select Exam Level, Exam, and Class before saving answers.");
      return;
    }

    const payload = {
      examLevel: selectedExamLevel,
      subject: selectedExam?.value || "",
      class: selectedClass,
      questions: answers,
    };

    if (isKGExam) {
      const err = validatePatternClient(scoringPattern);
      if (err) {
        alert(err);
        return;
      }
      payload.scoringPattern = {
        totalQuestions: Number(scoringPattern.totalQuestions),
        sections: scoringPattern.sections.map((s) => ({
          index: Number(s.index),
          from: Number(s.from),
          to: Number(s.to),
          marksPerQuestion: Number(s.marksPerQuestion),
          label: String(s.label || `Section ${s.index}`),
          isAchiever: Boolean(s.isAchiever),
        })),
      };
    }

    try {
      const response = await fetch(`${BASE_URL}/uploadAnswers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || "Answers saved successfully!");
        setSelectedExam(null);
        setSelectedExamLevel("");
        setSelectedClass("");
        setQuestionsCount(30);
        setAnswers({});
        setScoringPattern(null);
        setIsKGExam(false);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || "Failed to save answers");
      }
    } catch (error) {
      console.error("Error while saving answers:", error);
      alert("Error while saving answers");
    }
  };

  const patternMax =
    scoringPattern?.sections?.reduce(
      (sum, s) =>
        sum +
        (Number(s.to) - Number(s.from) + 1) * (Number(s.marksPerQuestion) || 0),
      0
    ) || 0;

  return (
    <div className="answer-key-upload">
      <div className="shadow-lg rounded-lg p-6 bg-white">
        <div className="flex w-full items-center justify-center mb-6">
          <h2 className="font-bold text-2xl text-gray-800">
            {selectedExamLevel === "L2" ? "Advance Answer Key" : "Basic Answer Key"}
          </h2>
        </div>

        <label className="block text-sm font-medium text-gray-700">Exam Level</label>
        <Select
          options={[
            { value: "L1", label: "Basic" },
            { value: "L2", label: "Advance" },
          ]}
          value={
            selectedExamLevel
              ? {
                  value: selectedExamLevel,
                  label: selectedExamLevel === "L1" ? "Basic" : "Advance",
                }
              : null
          }
          onChange={(selected) => setSelectedExamLevel(selected?.value || "")}
          className="basic-select w-90 mb-4"
          classNamePrefix="select"
          placeholder="Select Level"
        />

        <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">
          Select Exam
        </label>
        <Select
          options={exams
            .filter((exam) => exam.level === selectedExamLevel)
            .map((exam) => ({
              value: exam.name,
              label: exam.label || exam.name,
              isKG: exam.isKG || false,
            }))}
          value={selectedExam}
          onChange={(selected) => {
            setSelectedExam(selected);
            setIsKGExam(selected?.isKG || false);
            setSelectedClass("");
            setAnswers({});
            setScoringPattern(null);
            if (!selected?.isKG) setQuestionsCount(30);
          }}
          className="basic-select w-90 mb-4"
          classNamePrefix="select"
          placeholder="Select exam..."
        />

        <label className="block text-sm font-medium text-gray-700 mt-7">Class</label>
        <Select
          options={
            isKGExam
              ? [
                  { value: "NURSERY", label: "Nursery" },
                  { value: "LKG", label: "LKG" },
                  { value: "UKG", label: "UKG" },
                ]
              : [...Array(12)].map((_, i) => ({
                  value: (i + 1).toString(),
                  label: `Class ${i + 1}`,
                }))
          }
          value={
            selectedClass
              ? {
                  value: selectedClass,
                  label: ["NURSERY", "LKG", "UKG"].includes(selectedClass)
                    ? selectedClass === "NURSERY"
                      ? "Nursery"
                      : selectedClass
                    : `Class ${selectedClass}`,
                }
              : null
          }
          onChange={(selected) => {
            const value = selected?.value || "";
            setSelectedClass(value);
            if (isKGExam && value) applyKgDefaults(value);
          }}
          className="basic-select w-90 mb-4"
          classNamePrefix="select"
          placeholder="Select Class"
        />

        {isKGExam && scoringPattern && (
          <div className="mt-6 mb-6 border border-indigo-200 rounded-lg p-4 bg-indigo-50/40">
            <h3 className="font-semibold text-lg text-gray-800 mb-1">
              Scoring pattern (1…N sections)
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Define how many questions each section covers and marks per question.
              This pattern is saved with the answer key and used for KG auto-scoring.
              Defaults are pre-filled; edit freely.
            </p>

            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Total questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="border rounded px-3 py-2 w-28"
                  value={scoringPattern.totalQuestions}
                  onChange={(e) =>
                    updatePatternField("totalQuestions", e.target.value)
                  }
                />
              </div>
              <div className="text-sm text-gray-700 pb-2">
                Max score: <strong>{patternMax}</strong>
              </div>
              <button
                type="button"
                onClick={addSection}
                className="bg-indigo-600 text-white text-sm px-3 py-2 rounded hover:bg-indigo-700"
              >
                + Add section
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border bg-white">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Label</th>
                    <th className="p-2 border">From Q</th>
                    <th className="p-2 border">To Q</th>
                    <th className="p-2 border">Marks / Q</th>
                    <th className="p-2 border">Achiever</th>
                    <th className="p-2 border"></th>
                  </tr>
                </thead>
                <tbody>
                  {scoringPattern.sections.map((sec, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min={1}
                          className="border rounded px-2 py-1 w-16"
                          value={sec.index}
                          onChange={(e) =>
                            updateSection(idx, "index", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-36"
                          value={sec.label}
                          onChange={(e) =>
                            updateSection(idx, "label", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min={1}
                          className="border rounded px-2 py-1 w-20"
                          value={sec.from}
                          onChange={(e) =>
                            updateSection(idx, "from", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min={1}
                          className="border rounded px-2 py-1 w-20"
                          value={sec.to}
                          onChange={(e) =>
                            updateSection(idx, "to", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          className="border rounded px-2 py-1 w-20"
                          value={sec.marksPerQuestion}
                          onChange={(e) =>
                            updateSection(idx, "marksPerQuestion", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(sec.isAchiever)}
                          onChange={(e) =>
                            updateSection(idx, "isAchiever", e.target.checked)
                          }
                        />
                      </td>
                      <td className="p-2 border">
                        <button
                          type="button"
                          disabled={scoringPattern.sections.length <= 1}
                          onClick={() => removeSection(idx)}
                          className="text-red-600 text-xs disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="upload-section mt-6">
          <h3 className="font-semibold mb-3 text-xl text-gray-800">
            Questions
            {isKGExam && selectedClass ? (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedClass}: {questionsCount} questions — A/B only)
              </span>
            ) : null}
          </h3>
          {isKGExam && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
              Set the scoring pattern above, then enter answers. Upload this key
              before KG result responses (p1…pN). Section count and marks are
              taken from your pattern — not hardcoded.
            </p>
          )}
          {[...Array(questionsCount)].map((_, index) => (
            <div key={index} className="question-item mb-4 p-4 border rounded bg-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question {index + 1}
              </label>
              <div className="flex gap-4">
                {(isKGExam ? ["A", "B"] : ["A", "B", "C", "D"]).map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      className="mr-1"
                      checked={answers[index] === option}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={addMoreQuestions}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add More Questions
          </button>
          <button
            onClick={handleSaveAnswers}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4 ml-5"
          >
            Save Answers
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnswerKeyUpload;
