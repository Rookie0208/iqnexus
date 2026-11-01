import { answersModel } from "../models/answersModel.js";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import {
  isKgClass,
  normalizeKgClass,
} from "../utils/kgHelpers.js";
import {
  isKgExamSubject,
  normalizeKgExamSubject,
  getKgQuestionCount,
} from "../utils/kgScoringConfig.js";

export const uploadAnswers = async (req, res) => {
  try {
    const { examLevel, subject, class: className, questions } = req.body;

    if (!examLevel || !subject || !className || !questions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedSubject = normalizeKgExamSubject(subject) || subject;
    const normalizedClass = isKgExamSubject(subject)
      ? normalizeKgClass(className) || String(className).trim().toUpperCase()
      : String(className).trim();

    if (isKgExamSubject(subject) && !normalizeKgClass(className)) {
      return res.status(400).json({
        message: "KG answer key class must be NURSERY, LKG, or UKG",
      });
    }

    // Upsert so re-uploads replace the previous key for same exam+class
    const saved = await answersModel.findOneAndUpdate(
      { subject: normalizedSubject, class: normalizedClass, examLevel },
      {
        $set: {
          examLevel,
          subject: normalizedSubject,
          class: normalizedClass,
          questions,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Answers uploaded successfully",
      subject: saved.subject,
      class: saved.class,
      questionCount: Object.keys(questions || {}).length,
      expectedQuestions: isKgExamSubject(subject)
        ? getKgQuestionCount(normalizedClass)
        : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAnswers = async (req, res) => {
  const subjectsToFetch = [];
  try {
    const { rollNo, className, schoolCode } = req.body;

    if (!rollNo || !schoolCode || !className) {
      return res
        .status(400)
        .json({ message: "Missing required query parameters" });
    }

    let studentData = null;
    if (isKgClass(className)) {
      studentData = await KINDERGARTEN_STUDENT.findOne({
        schoolCode: Number(schoolCode),
        class: normalizeKgClass(className) || className,
        rollNo,
      });
      if (studentData) {
        if (studentData.IQKD1 === "1") subjectsToFetch.push("IQKD1");
        if (studentData.IQKD2 === "1") subjectsToFetch.push("IQKD2");
      }
    } else {
      studentData = await STUDENT_LATEST.findOne({
        schoolCode: Number(schoolCode),
        class: className,
        rollNo,
      });
      if (studentData) {
        if (studentData.IAOL1 === "1") subjectsToFetch.push("IAOL1");
        if (studentData.ITSTL1 === "1") subjectsToFetch.push("ITSTL1");
        if (studentData.IMOL1 === "1") subjectsToFetch.push("IMOL1");
        if (studentData.IGKOL1 === "1") subjectsToFetch.push("IGKOL1");
        if (studentData.IENGOL1 === "1") subjectsToFetch.push("IENGOL1");
        if (studentData.IAOL2 === "1") subjectsToFetch.push("IAOL2");
        if (studentData.ITSTL2 === "1") subjectsToFetch.push("ITSTL2");
        if (studentData.IMOL2 === "1") subjectsToFetch.push("IMOL2");
        if (studentData.IENGOL2 === "1") subjectsToFetch.push("IENGOL2");
      }
    }

    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }

    const query = {
      subject: { $in: subjectsToFetch },
      class: isKgClass(className)
        ? normalizeKgClass(className) || className
        : className,
    };
    const answers = await answersModel.find({ ...query });

    if (!answers || answers.length === 0) {
      return res.status(404).json({ message: "Answers List not available" });
    }

    res.status(200).json({ answerKeys: answers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
