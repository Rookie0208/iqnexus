import React from "react";
import "../styles/AnswerKeys.css";

const AnswerKeys = () => {
  const answerKeys = [
    { exam: "Math Test 2024", file: "math_test_2024.pdf" },
    { exam: "Science Quiz 2024", file: "science_quiz_2024.pdf" },
    { exam: "English Exam 2024", file: "english_exam_2024.pdf" },
    { exam: "General Knowledge Test", file: "gk_test.pdf" },
  ];

  return (
    <div className="answer-keys-container">
      <h2>Answer Keys</h2>
      <table className="answer-keys-table">
        <thead>
          <tr>
            <th>Exam Name</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {answerKeys.map((key, index) => (
            <tr key={index}>
              <td>{key.exam}</td>
              <td>
                <a href={`/downloads/${key.file}`} download>
                  📄 Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnswerKeys;
