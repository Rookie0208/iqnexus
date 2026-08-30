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

function buildIdFilters(id) {
  const filters = [{ _id: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    filters.push({ _id: new mongoose.Types.ObjectId(id) });
  }
  return filters;
}

function parseS3Location(pdfLink) {
  try {
    const url = new URL(pdfLink);
    const host = url.hostname;
    const pathKey = decodeURIComponent(url.pathname.replace(/^\//, ""));

    const virtualHosted = host.match(/^(.+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/);
    if (virtualHosted) {
      return {
        bucket: virtualHosted[1],
        region: virtualHosted[2],
        key: pathKey,
      };
    }

    const legacyVirtualHosted = host.match(/^(.+)\.s3\.amazonaws\.com$/);
    if (legacyVirtualHosted) {
      return {
        bucket: legacyVirtualHosted[1],
        region: process.env.AWS_REGION,
        key: pathKey,
      };
    }

    const pathStyle = host.match(/^s3[.-]([a-z0-9-]+)\.amazonaws\.com$/);
    if (pathStyle) {
      const [bucket, ...rest] = pathKey.split("/");
      if (!bucket || rest.length === 0) return null;
      return {
        bucket,
        region: pathStyle[1],
        key: rest.join("/"),
      };
    }
  } catch (error) {
    console.error("Failed to parse pdfLink for S3 delete:", pdfLink, error.message);
  }
  return null;
}

async function deletePdfFromS3(pdfLink) {
  const location = parseS3Location(pdfLink);
  if (!location?.bucket || !location?.key) {
    console.warn("Skipping S3 delete — could not parse pdfLink:", pdfLink);
    return;
  }

  const s3Client = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    region: location.region || process.env.AWS_REGION,
  });

  try {
    await s3Client
      .deleteObject({
        Bucket: location.bucket,
        Key: location.key,
      })
      .promise();
  } catch (error) {
    if (error.code === "NoSuchKey" || error.code === "NotFound") {
      console.warn("S3 object already missing:", location.bucket, location.key);
      return;
    }
    throw error;
  }
}

export const addStudentStudyMaterial = async (req, res) => {
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
    const doc = await StudyMaterial.findOne({ $or: buildIdFilters(id) });
    if (!doc) {
      return res.status(404).json({ message: "Study material not found" });
    }

    if (doc.pdfLink) {
      await deletePdfFromS3(doc.pdfLink);
    }

    await StudyMaterial.deleteOne({ _id: doc._id });

    res.json({ message: "Study material deleted successfully" });
  } catch (error) {
    console.error("Error deleting study material:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
