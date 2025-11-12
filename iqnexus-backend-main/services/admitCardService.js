import nodeHtmlToImage from "node-html-to-image";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongoURI = process.env.MONGO_URI;
const dataBaseName = process.env.DATABASE_NAME;

async function databaseConnection() {
  const client = new MongoClient(mongoURI);
  await client.connect();
  return { conn: client.db(dataBaseName), status: "success" };
}

async function dbConnection() {
  try {
    const conn = mongoose.createConnection(process.env.MONGO_URI);

    return new Promise((resolve, reject) => {
      conn.once("open", async () => {
        const collections = await conn.db.listCollections().toArray();
        const collectionNames = collections.map((col) => col.name);

        if (
          collectionNames.includes("admitCards.files") &&
          collectionNames.includes("admitCards.chunks")
        ) {
        } else {
          new GridFSBucket(conn.db, { bucketName: "admitCards" });
        }

        resolve({ status: "success", conn });
      });

      conn.on("error", (err) => {
        console.error("❌ MongoDB Connection Error:", err);
        reject({ status: "failed", error: err.message });
      });
    });
  } catch (error) {
    console.error("❌ Database connection error:", error);
    return { status: "failed", error: error.message };
  }
}

async function generateAdmitCard(students, level, /* session, */ examDate, school) {
  try {
    const outputDir = "./outputs";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    } else {
      fs.readdirSync(outputDir).forEach((file) => {
        fs.unlinkSync(path.join(outputDir, file));
      });
    }

    const templatePath = path.join(__dirname, "designs", "admitCard.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const logoPath = path.join(__dirname, "assets", "logo.png");
    const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    const logoSrc = `data:image/png;base64,${logoBase64}`;

    const suffix = level === "L1" ? "Basic Level" : "Advance Level";
    const subjectLevel = level === "L1" ? "Basic" : "Advance";

    const results = [];
    for (const student of students) {
      const outputPath = `./outputs/admitCard_${student.studentName}-${level}-${student._id}.png`;
      const filename = `admitCard_${student.studentName}-${level}-${student._id}.png`;

      // Check if admit card already exists in GridFS
      const dbResponse = await dbConnection();
      if (dbResponse.status !== "success") {
        throw new Error("Database connection failed");
      }
      const db = dbResponse.conn.db;
      const existingFile = await db
        .collection("admitCards.files")
        .findOne({ filename });

      if (existingFile) {
        console.log(`Admit card already exists for ${student.studentName}: ${filename}`);
        results.push({
          success: true,
          mobNo: student.mobNo,
          fileId: existingFile._id,
          message: "Admit card already generated",
        });
        continue;
      }

      const levelSuffix = level === "L1" ? "1" : "2";
      const IAOL = student[`IAOL${levelSuffix}`] === "1";
      const ITSTL = student[`ITSTL${levelSuffix}`] === "1";
      const IMOL = student[`IMOL${levelSuffix}`] === "1";
      const IGKOL = student[`IGKOL${levelSuffix}`] === "1";
      const IENGOL = student[`IENGOL${levelSuffix}`] === "1";

      await nodeHtmlToImage({
        output: outputPath,
        html: fs.readFileSync(templatePath, "utf8"),
        content: {
          logoSrc,
          name: student.studentName,
          father: student.fatherName,
          mother: student.motherName,
          class: student.class,
          section: student.section,
          rollNo: student.rollNo,
          schoolCode: student.schoolCode,
          mobile: student.mobNo,
          city: student.city || "N/A",
          school: school.schoolName || "Unknown School",
          state: student.state || "N/A",
          country: student.country || "India",
          examCenter: student.examCenter || "To Be Assigned",
          level: suffix,
          examDate: examDate || "N/A",
          classTeacher: school.incharge || "N/A",
          principal: school.principalName || "N/A",
          qrUrl:
            "https://api.qrserver.com/v1/create-qr-code/?data=https://wa.me/919999999999&size=100x100",
          IAOL,
          ITSTL,
          IMOL,
          IGKOL,
          IENGOL,
        },
        puppeteerArgs: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          defaultViewport: {
            width: 900,
            height: 1100,
          },
        },
        type: "png",
        quality: 100,
      });

      if (!fs.existsSync(outputPath)) {
        console.error(`File creation failed: ${outputPath}`);
        results.push({
          success: false,
          mobNo: student.mobNo,
          error: `Failed to generate file: ${outputPath}`,
        });
        continue;
      }
      console.log(`File created: ${outputPath}`);
      results.push({ success: true, path: outputPath, mobNo: student.mobNo });
    }

    return results;
  } catch (error) {
    console.error("Error generating admit cards:", error);
    return students.map((student) => ({
      success: false,
      mobNo: student.mobNo,
      error: error.message,
    }));
  }
}

async function uploadAdmitCard(students, level, db, examDate) {
  try {
    const gfs = new GridFSBucket(db, { bucketName: "admitCards" });
    const results = [];

    for (const student of students) {
      const admitCardPath = `./outputs/admitCard_${student.studentName}-${level}-${student._id}.png`;
      const filename = `admitCard_${student.studentName}-${level}-${student._id}.png`;

      if (!fs.existsSync(admitCardPath)) {
        console.error(`File missing: ${admitCardPath}`);
        results.push({
          mobNo: student.mobNo,
          error: "Admit card file does not exist",
        });
        continue;
      }

      const existingFile = await db
        .collection("admitCards.files")
        .findOne({ filename });

      if (existingFile) {
        console.log(`File already exists in GridFS: ${filename}`);
        results.push({
          mobNo: student.mobNo,
          success: true,
          fileId: existingFile._id,
          message: "Admit card already exists in storage",
        });
        fs.unlinkSync(admitCardPath);
        continue;
      }

      const fileStream = fs.createReadStream(admitCardPath);
      const writeStream = gfs.openUploadStream(filename, {
        contentType: "image/png",
        metadata: {
          studentId: student._id,
          mobNo: student.mobNo,
          examDate: examDate,
        },
      });

      fileStream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on("finish", () => {
          fs.unlinkSync(admitCardPath);
          console.log(`File uploaded and deleted: ${admitCardPath}`);
          results.push({
            mobNo: student.mobNo,
            success: true,
            fileId: writeStream.id,
            message: "Admit card stored successfully",
          });
          resolve();
        });

        writeStream.on("error", (err) => {
          console.error(`Upload error for ${filename}: ${err.message}`);
          results.push({
            mobNo: student.mobNo,
            error: "Failed to upload admit card",
          });
          reject(err);
        });
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Error processing admit cards:", error);
    return students.map((student) => ({
      mobNo: student.mobNo,
      error: error.message,
    }));
  }
}

async function fetchAdmitCardFromDB(studentId, studentName, level, res) {
  try {
    const dbResponse = await databaseConnection();
    if (dbResponse.status !== "success") {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const db = dbResponse.conn;
    const gfs = new GridFSBucket(db, { bucketName: "admitCards" });
    const fileExists = await db
      .collection("admitCards.files")
      .findOne({ filename: `admitCard_${studentName}-${level}-${studentId}.png` });

    if (!fileExists) {
      return res.status(404).json({ error: "Admit card not found" });
    }

    res.setHeader("Content-Type", "image/png");
    const readStream = gfs.openDownloadStream(fileExists._id);
    readStream.pipe(res);
  } catch (error) {
    console.error("❌ Error fetching admit card:", error);
    res.status(500).json({ error: "Failed to fetch admit card" });
  }
}

export {
  generateAdmitCard,
  dbConnection,
  uploadAdmitCard,
  fetchAdmitCardFromDB,
};