import mongoose from "mongoose";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

const studyMaterialSchema = new mongoose.Schema({
  id: Number,
  class: mongoose.Schema.Types.Mixed, // Allow both Number and String (for kindergarten)
  kgSection: String,
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
    console.error("🚨 Error: Class information not found for the student");
    return res.status(400).json({
      success: false,
      message: "Class information not found for the student"
    });
  }

  // Check if this is a kindergarten student (class = "KD")
  const isKindergarten = className === "KD";

  // For kindergarten, kgSection is required
  if (isKindergarten && !kgSection) {
    console.error("🚨 Error: Kindergarten section not provided");
    return res.status(400).json({
      success: false,
      message: "Kindergarten section is required"
    });
  }

  try {
    // For kindergarten, query with class "kindergarten" (as stored in DB)
    // For regular students, use the numeric class value
    let studentData;
    
    if (isKindergarten) {
      // Query kindergarten student model
      studentData = await KINDERGARTEN_STUDENT.findOne({
        rollNo: rollNo,
        class: "KD"
      });
      
      if (!studentData) {
        return res.status(404).json({
          success: false,
          message: "Kindergarten student not found"
        });
      }

      console.log("📚 KG Student Data:", {
        rollNo: studentData.rollNo,
        section: studentData.section,
        IQKD1: studentData.IQKD1,
        IQKD2: studentData.IQKD2
      });

      // For KG students, check IQKD1 and IQKD2 exams
      if (studentData.IQKD1 === "1") {
        const material = await StudyMaterial.find({
          examId: "IQKD1",
          class: "kindergarten",
          kgSection: kgSection
        });
        console.log(`📖 Found ${material.length} materials for IQKD1`);
        studyMaterialArray.push(...material);
      }
      if (studentData.IQKD2 === "1") {
        const material = await StudyMaterial.find({
          examId: "IQKD2",
          class: "kindergarten",
          kgSection: kgSection
        });
        console.log(`📖 Found ${material.length} materials for IQKD2`);
        studyMaterialArray.push(...material);
      }
    } else {
      // Query regular student model
      studentData = await STUDENT_LATEST.findOne({
        rollNo: rollNo,
        class: className
      });

      if (!studentData) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      // For regular students (class 1-12), check regular exams
      if (studentData.IAOL1 === "1") {
        const material = await StudyMaterial.find({
          examId: "IAOL1",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.ITSTL1 === "1") {
        const material = await StudyMaterial.find({
          examId: "ITSTL1",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IMOL1 === "1") {
        const material = await StudyMaterial.find({
          examId: "IMOL1",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IENGOL1 === "1") {
        const material = await StudyMaterial.find({
          examId: "IENGOL1",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IGKOL1 === "1") {
        const material = await StudyMaterial.find({
          examId: "IGKOL1",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IAOL2 === "1") {
        const material = await StudyMaterial.find({
          examId: "IAOL2",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.ITSTL2 === "1") {
        const material = await StudyMaterial.find({
          examId: "ITSTL2",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IMOL2 === "1") {
        const material = await StudyMaterial.find({
          examId: "IMOL2",
          class: className
        });
        studyMaterialArray.push(...material);
      }
      if (studentData.IENGOL2 === "1") {
        const material = await StudyMaterial.find({
          examId: "IENGOL2",
          class: className
        });
        studyMaterialArray.push(...material);
      }
    }

    console.log("Study materials fetched successfully:", studyMaterialArray);
    res.status(200).json({
      success: true,
      message: "Study materials fetched successfully",
      data: studyMaterialArray,
    });

  } catch (error) {
    console.error("❌ Error fetching study material:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching study materials",
      error: error.message
    });
  }
}

export { fetchStudyMaterial, mongoose, StudyMaterial };