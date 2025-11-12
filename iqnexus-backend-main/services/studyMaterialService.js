import mongoose from "mongoose";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

const studyMaterialSchema = new mongoose.Schema({
  id: Number,
  class: Number,
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
  const {  rollNo,className } = req.body;

  const studyMaterialArray=[]
  if (!className) {
    console.error("🚨 Error: Class information not found for the student");
    throw new Error("Class information not found for the student");
  }
  try {
    const materials = await StudyMaterial.find({  class: className });
    
    if (materials.length === 0) {
  
      throw new Error("No study materials found for this class");
    }
    else {
      const studentData= await STUDENT_LATEST.findOne({
        rollNo:rollNo,
        class: className
      })
      if(studentData.IAOL1 === "1") {
    const material =await StudyMaterial.find({
      examId: "IAOL1",
    })
    studyMaterialArray.push(material);

      }
      if(studentData.ITSTL1 === "1") {
    const material = await StudyMaterial.find({
      examId: "ITSTL1",
    });
    studyMaterialArray.push(material);
      }
            if(studentData.IMOL1 === "1") {
    const material = await StudyMaterial.find({
      examId: "IMOL1",
    });
    studyMaterialArray.push(material);
      }
            if(studentData.IENGOL1 === "1") {
    const material = await StudyMaterial.find({
      examId: "IENGOL1",
    });
    studyMaterialArray.push(material);
      }
            if(studentData.IGKOL1 === "1") {
    const material = await StudyMaterial.find({
      examId: "IGKOL1",
    });

    studyMaterialArray.push(material);
      }
            if(studentData.IAOL2 === "1") {
    const material = await StudyMaterial.find({
      examId: "IAOL2",
    });
    studyMaterialArray.push(material);

  }

      if(studentData.ITSTL2 === "1") {
    const material = await StudyMaterial.find({
      examId: "ITSTL2",
    });
    studyMaterialArray.push(material);
  }
  
      if(studentData.IMOL2 === "1") {
    const material = await StudyMaterial.find({
      examId: "IMOL2",
    });
    studyMaterialArray.push(material);
  }
      if(studentData.IENGOL2 === "1") {   
    const material = await StudyMaterial.find({
      examId: "IENGOL2",
    });
    studyMaterialArray.push(material);
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

  }
}

export { fetchStudyMaterial, mongoose, StudyMaterial };