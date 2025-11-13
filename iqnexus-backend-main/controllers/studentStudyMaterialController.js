import AWS from "aws-sdk";
import fs from "fs";
import mongoose from "mongoose";
import { StudyMaterial } from "../services/studyMaterialService.js";

AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

export const addStudentStudyMaterial = async (req, res) => {
  console.log("Received request body:", req.body);
  console.log("Received file:", req.file);
  
  const { name, age, class: className, subject, fee, kgSection } = req.body;

  if (!req.file) {
    console.error("No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileContent = fs.readFileSync(req.file.path);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME || "epocho",
    Key: `pdfs/${Date.now()}_${req.file.originalname}`,
    Body: fileContent,
    ContentType: "application/pdf",
  };

  try {
    const result = await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); // optional: cleanup temp file
    
    // console.log("Creating study material with:", {
    //   category: name,
    //   class: className,
    //   kgSection: kgSection,
    //   examId: subject,
    //   cost: fee
    // });
    
    const resultMongo = await StudyMaterial.create({
      category: name,
      class: className,
      ...(kgSection && { kgSection: kgSection }),
      examId: subject,
      cost: fee,
      pdfLink: result.Location,
    });
    await resultMongo.save();
    
    // console.log("Study material saved:", resultMongo);
    // console.log("File uploaded successfully. Location:", result.Location);

    // console.log(result.Location);
    res.json({
      message: "Upload successful",
      url: result.Location,
      name,
      age,
    });
  } catch (err) {
    console.error("S3 Upload Error:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};
export const fetchStudyMaterialForAdmin = async (req, res) => {

  try {
    const studyMaterials = await StudyMaterial.find({});
    if (studyMaterials.length === 0) {
      return res.status(404).json({ message: "No study materials found" });
    }
    res.json(studyMaterials);
  } catch (error) {
    console.error("Error fetching study materials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteStudyMaterial = async (req, res) => {
  const { id } = req.params;

  try {
    // Since _id is stored as string in DB, we need to query directly as string
    // Use MongoDB native collection access to handle string _ids
    const collection = StudyMaterial.collection;
    const deleteResult = await collection.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Study material not found" });
    }

    res.json({ message: "Study material deleted successfully" });
  } catch (error) {
    console.error("Error deleting study material:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
