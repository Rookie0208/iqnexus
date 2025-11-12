import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Download, FileText } from "lucide-react";
import axios from "axios";
import { BASE_API_URL } from "../Api";

const dummyData = [
    {
        examlevel: "Easy",
        subject: "Math",
        className: "10",
        questions: {
            q1: "A", q2: "C", q3: "B", q4: "D", q5: "A", q6: "B", q7: "C", q8: "D", q9: "A", q10: "C",
            q11: "B", q12: "D", q13: "A", q14: "B", q15: "C", q16: "D", q17: "A", q18: "C", q19: "B", q20: "D",
            q21: "A", q22: "B", q23: "C", q24: "D", q25: "A", q26: "C", q27: "B", q28: "D", q29: "A", q30: "B",
            q31: "C", q32: "D", q33: "A", q34: "C", q35: "B", q36: "D", q37: "A", q38: "B", q39: "C", q40: "D"
        }
    },
    {
        examlevel: "Medium",
        subject: "Science",
        className: "9",
        questions: {
            q1: "B", q2: "D", q3: "A", q4: "C", q5: "B", q6: "D", q7: "A", q8: "C", q9: "B", q10: "D",
            q11: "A", q12: "C", q13: "B", q14: "D", q15: "A", q16: "C", q17: "B", q18: "D", q19: "A", q20: "C",
            q21: "B", q22: "D", q23: "A", q24: "C", q25: "B", q26: "D", q27: "A", q28: "C", q29: "B", q30: "D",
            q31: "A", q32: "C", q33: "B", q34: "D", q35: "A", q36: "C", q37: "B", q38: "D", q39: "A", q40: "C"
        }
    },
    {
        examlevel: "Hard",
        subject: "English",
        className: "11",
        questions: {
            q1: "C", q2: "B", q3: "D", q4: "A", q5: "C", q6: "B", q7: "D", q8: "A", q9: "C", q10: "B",
            q11: "D", q12: "A", q13: "C", q14: "B", q15: "D", q16: "A", q17: "C", q18: "B", q19: "D", q20: "A",
            q21: "C", q22: "B", q23: "D", q24: "A", q25: "C", q26: "B", q27: "D", q28: "A", q29: "C", q30: "B",
            q31: "D", q32: "A", q33: "C", q34: "B", q35: "D", q36: "A", q37: "C", q38: "B", q39: "D", q40: "A"
        }
    },
    {
        examlevel: "Easy",
        subject: "History",
        className: "8",
        questions: {
            q1: "D", q2: "C", q3: "B", q4: "A", q5: "D", q6: "C", q7: "B", q8: "A", q9: "D", q10: "C",
            q11: "B", q12: "A", q13: "D", q14: "C", q15: "B", q16: "A", q17: "D", q18: "C", q19: "B", q20: "A",
            q21: "D", q22: "C", q23: "B", q24: "A", q25: "D", q26: "C", q27: "B", q28: "A", q29: "D", q30: "C",
            q31: "B", q32: "A", q33: "D", q34: "C", q35: "B", q36: "A", q37: "D", q38: "C", q39: "B", q40: "A"
        }
    },
    {
        examlevel: "Medium",
        subject: "Geography",
        className: "7",
        questions: {
            q1: "A", q2: "B", q3: "C", q4: "D", q5: "A", q6: "B", q7: "C", q8: "D", q9: "A", q10: "B",
            q11: "C", q12: "D", q13: "A", q14: "B", q15: "C", q16: "D", q17: "A", q18: "B", q19: "C", q20: "D",
            q21: "A", q22: "B", q23: "C", q24: "D", q25: "A", q26: "B", q27: "C", q28: "D", q29: "A", q30: "B",
            q31: "C", q32: "D", q33: "A", q34: "B", q35: "C", q36: "D", q37: "A", q38: "B", q39: "C", q40: "D"
        }
    }
];
const AnswerKey = () => {
    const [answerKeys   , setAnswerKeys] = useState([]);

    useEffect(() => {
fetchAnswerKeys();
        
        }, []);
        const fetchAnswerKeys = async () => {
        try {
      const response=await  axios.post(`${BASE_API_URL}/getAnswers`, {
          rollNo: JSON.parse(localStorage.getItem("student_data"))['Roll No'],
          className: JSON.parse(localStorage.getItem("student_data"))['Class'],
            schoolCode: JSON.parse(localStorage.getItem("student_data"))['School Code']
        
        })
            if (response.status === 200) {
     
                console.log("Answer keys fetched successfully:", response.data.answerKeys);
                setAnswerKeys(response.data.answerKeys);
            } else {
                console.error("Failed to fetch answer keys:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching answer keys:", error);
        }
    }

    const [showPopup, setShowPopup] = useState(false);
    const [selectedQuestions, setSelectedQuestions] = useState(null);

    const handleShowAnswers = (questions) => {
        setSelectedQuestions(questions);
        setShowPopup(true);
    };

    const handleClose = () => {
        setShowPopup(false);
        setSelectedQuestions(null);
    };

    return (
        <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center text-blue-600">
                    <FileText />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Answer Keys</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow">
                    <thead className="bg-gray-100 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3 border-b text-left">Exam Level</th>
                            <th className="px-4 py-3 border-b text-left">Subject</th>
                            <th className="px-4 py-3 border-b text-left">Class</th>
                            <th className="px-4 py-3 border-b text-left">Answer Key</th>
                        </tr>
                    </thead>
                    <tbody>
                        {answerKeys.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition duration-200">
                                <td className="px-4 py-3 border-b">{item.examlevel==="L1" ? "Basic" :"Advance"}</td>
                                <td className="px-4 py-3 border-b">{item.subject}</td>
                                <td className="px-4 py-3 border-b">{item.class}</td>
                                <td className="px-4 py-3 border-b">
                                    <button
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                        onClick={() => handleShowAnswers(item.questions)}
                                    >
                                        Show Answer Key
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl min-w-[320px] max-h-[80vh] overflow-y-auto shadow-2xl w-full max-w-md relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition text-sm font-semibold"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h3 className="text-xl font-semibold mb-4 mt-2">Answer Key</h3>
                        <div className="rounded-xl overflow-hidden mb-4">
                            <table className="min-w-full text-sm text-gray-700">
                                <thead className="bg-gray-100 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Question</th>
                                        <th className="px-6 py-3 text-left">Answer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedQuestions &&
                                        Object.entries(selectedQuestions).map(([q, ans]) => (
                                            <tr
                                                key={q}
                                                className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200"
                                            >
                                                <td className="px-6 py-4">Q{Number(q)+1}</td>
                                                <td className="px-6 py-4">{ans}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnswerKey;