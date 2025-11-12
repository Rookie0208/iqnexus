import React, { useState } from "react";

const PracticeOMR = () => {
  const totalQuestions = 10;
  const options = ["A", "B", "C", "D"];
  const [responses, setResponses] = useState(Array(totalQuestions).fill(""));

  const handleOptionSelect = (questionIndex, option) => {
    const newResponses = [...responses];
    newResponses[questionIndex] = option;
    setResponses(newResponses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("OMR responses submitted successfully!");
  };

  return (
    <div className="omr-container">
      <h2>Practice OMR Sheet</h2>
      <form onSubmit={handleSubmit}>
        {Array.from({ length: totalQuestions }, (_, qIndex) => (
          <div key={qIndex} className="question">
            <span>Q{qIndex + 1}:</span>
            {options.map((option) => (
              <label key={option} className="option">
                <input
                  type="radio"
                  name={`q${qIndex}`}
                  value={option}
                  checked={responses[qIndex] === option}
                  onChange={() => handleOptionSelect(qIndex, option)}
                />
                {option}
              </label>
            ))}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default PracticeOMR;
