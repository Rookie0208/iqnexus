import AWS from "aws-sdk";
import fs from "fs";
import mongoose from "mongoose";
import { StudyMaterial } from "../services/studyMaterialService.js";

function configureAws() {
  AWS.config.update({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION,
  });
}

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
    return;
  }

  configureAws();
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

function cleanupTempFile(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

export const addStudentStudyMaterial = async (req, res) => {
  const {
    name,
    class: className,
    subject,
    fee,
    kgSection,
    materialType = "file",
    link,
  } = req.body;

  if (!name?.trim() || !className || !subject) {
    cleanupTempFile(req.file?.path);
    return res.status(400).json({ error: "Name, class, and subject are required" });
  }

  if (className === "kindergarten" && !kgSection) {
    cleanupTempFile(req.file?.path);
    return res.status(400).json({ error: "Kindergarten section (PG/LKG/UKG) is required" });
  }

  const cost = Number(fee) || 0;
  let pdfLink;

  try {
    if (materialType === "link") {
      if (!link?.trim()) {
        return res.status(400).json({ error: "Link URL is required" });
      }
      pdfLink = link.trim();
    } else {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!process.env.AWS_KEY?.trim() || !process.env.AWS_SECRET?.trim()) {
        cleanupTempFile(req.file.path);
        return res.status(500).json({
          error: "Upload failed",
          details:
            "AWS credentials not configured. Set AWS_KEY and AWS_SECRET in the backend .env, then restart.",
        });
      }

      configureAws();
      const s3 = new AWS.S3();
      const fileContent = fs.readFileSync(req.file.path);
      const bucket = process.env.AWS_BUCKET_NAME || "epocho-1.2";

      const result = await s3
        .upload({
          Bucket: bucket,
          Key: `pdfs/${Date.now()}_${req.file.originalname}`,
          Body: fileContent,
          ContentType: "application/pdf",
        })
        .promise();

      pdfLink = result.Location;
      cleanupTempFile(req.file.path);
    }

    const doc = await StudyMaterial.create({
      category: name.trim(),
      class: className,
      ...(kgSection && { kgSection }),
      examId: subject,
      cost,
      isAvailableForFree: cost === 0 ? "true" : "false",
      pdfLink,
    });

    res.json({
      message: "Upload successful",
      url: pdfLink,
      id: doc._id,
    });
  } catch (err) {
    cleanupTempFile(req.file?.path);
    console.error("Study material upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

export const fetchStudyMaterialForAdmin = async (req, res) => {
  try {
    const studyMaterials = await StudyMaterial.find({}).sort({ _id: -1 }).lean();
    res.json(studyMaterials);
  } catch (error) {
    console.error("Error fetching study materials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
