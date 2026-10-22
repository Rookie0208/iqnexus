import mongoose from "mongoose";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import {
  isKgClass,
  normalizeKgClass,
  kgStudentsClassQuery,
} from "../utils/kgHelpers.js";

const studyMaterialSchema = new mongoose.Schema({
  id: Number,
  class: mongoose.Schema.Types.Mixed, // Number (1–12) or KG class string (NURSERY/LKG/UKG)
  kgSection: String, // optional school section A/B/C (legacy also held PG/LKG/UKG)
  category: String,
  examId: String,
  cost: Number,
  strikeThroughCost: Number,
  isAvailableForFree: String,
  pdfLink: String,
});

const StudyMaterial = mongoose.model(
  "StudyMaterial",
  studyMaterialSchema,
  "study-material"
);

async function fetchStudyMaterial(req, res) {
  console.log("Fetching study material for class:", req.body);
  const { rollNo, className, kgSection } = req.body;

  const studyMaterialArray = [];

  if (!className) {
    return res.status(400).json({
      success: false,
      message: "Class information not found for the student",
    });
  }

  const kgClass = normalizeKgClass(className) || normalizeKgClass(kgSection);
  const isKindergarten = isKgClass(className) || !!kgClass;

  try {
    let studentData;

    if (isKindergarten) {
      const classQuery = kgClass
        ? { rollNo, class: kgClass }
        : { rollNo, ...kgStudentsClassQuery() };

      studentData = await KINDERGARTEN_STUDENT.findOne(classQuery);

      // Fallback: roll only within KG collection (legacy KD rows)
      if (!studentData) {
        studentData = await KINDERGARTEN_STUDENT.findOne({ rollNo });
      }

      if (!studentData) {
        return res.status(404).json({
          success: false,
          message: "Kindergarten student not found",
        });
      }

      const materialClass = normalizeKgClass(studentData.class) || kgClass;
      // Match materials by real class; also accept legacy "kindergarten" + kgSection=class
      const classMatch = materialClass
        ? {
            $or: [
              { class: materialClass },
              { class: materialClass.toLowerCase() },
              { class: "kindergarten", kgSection: materialClass },
              { class: "kindergarten", kgSection: { $in: legacySectionAliases(materialClass) } },
              { class: "KD", kgSection: materialClass },
            ],
          }
        : { class: "kindergarten" };

      console.log("📚 KG Student Data:", {
        rollNo: studentData.rollNo,
        class: studentData.class,
        section: studentData.section,
        IQKD1: studentData.IQKD1,
        IQKD2: studentData.IQKD2,
        materialClass,
      });

      if (studentData.IQKD1 === "1") {
        const material = await StudyMaterial.find({
          examId: { $in: ["IQKD1", "IQKD", "IQKG1", "IQKGL1"] },
          ...classMatch,
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IQKD2 === "1") {
        const material = await StudyMaterial.find({
          examId: { $in: ["IQKD2", "IQKG2", "IQKGL2"] },
          ...classMatch,
        });
        studyMaterialArray.push(...material);
      }
    } else {
      studentData = await STUDENT_LATEST.findOne({
        rollNo: rollNo,
        class: className,
      });

      if (!studentData) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      const examFields = [
        "IAOL1", "ITSTL1", "IMOL1", "IENGOL1", "IGKOL1",
        "IAOL2", "ITSTL2", "IMOL2", "IENGOL2",
      ];
      for (const field of examFields) {
        if (studentData[field] === "1") {
          const material = await StudyMaterial.find({
            examId: field,
            class: className,
          });
          studyMaterialArray.push(...material);
        }
      }
    }

    // Deduplicate by _id
    const seen = new Set();
    const unique = studyMaterialArray.filter((m) => {
      const id = String(m._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.status(200).json({
      success: true,
      message:
        unique.length === 0
          ? "No study materials available for your enrolled exams"
          : "Study materials fetched successfully",
      data: unique,
    });
  } catch (error) {
    console.error("❌ Error fetching study material:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching study materials",
      error: error.message,
    });
  }
}

function legacySectionAliases(kgClass) {
  if (kgClass === "NURSERY") return ["NURSERY", "PG", "Play Group"];
  if (kgClass === "LKG") return ["LKG", "LK"];
  if (kgClass === "UKG") return ["UKG", "UK", "UKD"];
  return [kgClass];
}

export { fetchStudyMaterial, mongoose, StudyMaterial };
