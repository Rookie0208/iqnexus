import React, { useState } from 'react';
import Select from "react-select";
import { BASE_URL } from '../Api';

const AnswerKeyUpload = () => {
    const [file, setFile] = useState(null);
    
    const [uploading, setUploading] = useState(false);
      const [selectedExam, setSelectedExam] = useState([]);
      const [selectedExamLevel, setSelectedExamLevel] = useState("");
      const [isKGExam, setIsKGExam] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        // Add upload logic here
        setUploading(false);
    };
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

  const KG_QUESTION_COUNTS = { NURSERY: 20, LKG: 25, UKG: 30 };

    const [selectedClass, setSelectedClass] = useState("");
    const [questionsCount, setQuestionsCount] = useState(30);
    const [answers, setAnswers] = useState({});
    const handleAnswerChange = (questionIndex, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    const addMoreQuestions = () => {
        setQuestionsCount(prev => prev + 5);
    };

    const applyKgQuestionCount = (classValue) => {
      const count = KG_QUESTION_COUNTS[classValue] || 30;
      setQuestionsCount(count);
      setAnswers((prev) => {
        const next = {};
        for (let i = 0; i < count; i++) {
          if (prev[i] !== undefined) next[i] = prev[i];
        }
        return next;
      });
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

        try {
            const response = await fetch(`${BASE_URL}/uploadAnswers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || "Answers saved successfully!");
                setSelectedExam([]);
                setSelectedExamLevel("");
                setSelectedClass("");
                setQuestionsCount(30);
                setAnswers({});
            } else {
                const err = await response.json().catch(() => ({}));
                alert(err.message || "Failed to save answers");
                console.error("Failed to save answers:", response.statusText, err);
            }
        } catch (error) {
            console.error("Error while saving answers:", error);
            alert("Error while saving answers");
        }
    };

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
                    value={selectedExamLevel ? { value: selectedExamLevel, label: selectedExamLevel === "L1" ? "Basic" : "Advance" } : null}
                    onChange={(selected) => setSelectedExamLevel(selected?.value || "")}
                    className="basic-select w-90 mb-4"
                    classNamePrefix="select"
                    placeholder="Select Level"
                    styles={{
                        control: (base) => ({
                            ...base,
                            padding: "0.1rem",
                            fontSize: "0.875rem",
                            borderColor: "black",
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 50,
                        }),
                    }}
                />
                <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">Select Exam</label>
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
                        if (!selected?.isKG) setQuestionsCount(30);
                    }}
                    className="basic-select w-90 mb-4"
                    classNamePrefix="select"
                    placeholder="Select exam..."
                    styles={{
                        control: (base) => ({
                            ...base,
                            padding: "0.1rem",
                            fontSize: "0.875rem",
                            borderColor: "black",
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 50,
                        }),
                    }}
                />
                <label className="block text-sm font-medium text-gray-700 mt-7">Class</label>
                <Select
                    options={isKGExam
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
                    value={selectedClass ? {
                      value: selectedClass,
                      label: ["NURSERY", "LKG", "UKG"].includes(selectedClass)
                        ? (selectedClass === "NURSERY" ? "Nursery" : selectedClass)
                        : `Class ${selectedClass}`,
                    } : null}
                    onChange={(selected) => {
                      const value = selected?.value || "";
                      setSelectedClass(value);
                      if (isKGExam && value) applyKgQuestionCount(value);
                    }}
                    className="basic-select w-90 mb-4"
                    classNamePrefix="select"
                    placeholder="Select Class"
                    styles={{
                        control: (base) => ({
                            ...base,
                            padding: "0.1rem",
                            fontSize: "0.875rem",
                            borderColor: "black",
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 50,
                        }),
                    }}
                />
                <div className="upload-section mt-6">
                    <h3 className='font-semibold mb-3 text-xl text-gray-800'>
                      Questions
                      {isKGExam && selectedClass ? (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({selectedClass}: {questionsCount} questions — A/B only)
                        </span>
                      ) : null}
                    </h3>
                    {isKGExam && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                        NURSERY=20, LKG=25, UKG=30. Upload this key before KG result responses (p1…p30).
                        General questions are 1 mark; last 5 Achiever questions are 2 marks each.
                      </p>
                    )}
                    {[...Array(questionsCount)].map((_, index) => (
                        <div key={index} className="question-item mb-4 p-4 border rounded bg-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Question {index + 1}
                            </label>
                            <div className="flex gap-4">
                                {(isKGExam ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map((option) => (
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