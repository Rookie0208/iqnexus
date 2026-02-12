import PDFDocument from "pdfkit";
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
    }

    const logoPath = path.join(__dirname, "..", "assets", "logo.png");
    
    const suffix = level === "L1" ? "Basic Level" : "Advance Level";

    const results = [];
    for (const student of students) {
      const outputPath = `./outputs/admitCard_${student.studentName}-${level}-${student._id}.pdf`;
      const filename = `admitCard_${student.studentName}-${level}-${student._id}.pdf`;

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
      
      // Check if this is a kindergarten student
      const isKindergartenStudent = student.class === "KD" || student.IQKD1 !== undefined || student.IQKD2 !== undefined;
      
      let IAOL, ITSTL, IMOL, IGKOL, IENGOL;
      
      if (isKindergartenStudent) {
        const isEnrolled = student[`IQKD${levelSuffix}`] === "1";
        IAOL = isEnrolled;
        ITSTL = isEnrolled;
        IMOL = isEnrolled;
        IGKOL = isEnrolled;
        IENGOL = isEnrolled;
      } else {
        IAOL = student[`IAOL${levelSuffix}`] === "1";
        ITSTL = student[`ITSTL${levelSuffix}`] === "1";
        IMOL = student[`IMOL${levelSuffix}`] === "1";
        IGKOL = student[`IGKOL${levelSuffix}`] === "1";
        IENGOL = student[`IENGOL${levelSuffix}`] === "1";
      }

      // Generate PDF using PDFKit
      await generateAdmitCardPDF({
        outputPath,
        logoPath,
        student: {
          name: student.studentName,
          father: student.fatherName,
          mother: student.motherName,
          class: student.class,
          section: student.section,
          rollNo: student.rollNo,
        },
        school: {
          name: school.schoolName || "Unknown School",
          classTeacher: school.incharge || "N/A",
          principal: school.principalName || "N/A",
        },
        exams: { IAOL, ITSTL, IMOL, IGKOL, IENGOL },
        level: suffix,
        examDate: examDate || "N/A",
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

// Pure JavaScript PDF generation using PDFKit - No browser required
async function generateAdmitCardPDF({ outputPath, logoPath, student, school, exams, level, examDate }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [595, 842], // A4 size
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const pageWidth = 595;
      const contentWidth = pageWidth - 80; // margins

      // Colors
      const primaryColor = "#db2777";
      const textColor = "#333333";
      const borderColor = "#cccccc";

      // Header - Logo
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (pageWidth - 150) / 2, 40, { width: 150 });
      }

      // Title Section
      doc.moveDown(6);
      doc.fontSize(20).font("Helvetica-Bold").fillColor(textColor).text("ADMIT CARD", { align: "center" });
      doc.fontSize(14).fillColor(primaryColor).text("INTERNATIONAL OLYMPIAD EXAMS", { align: "center" });
      doc.fontSize(12).text(level.toUpperCase(), { align: "center" });
      doc.text(`Exam Date: ${examDate}`, { align: "center" });

      // Draw border around the card
      doc.rect(30, 30, pageWidth - 60, 780).stroke(borderColor);

      // Student Details Section
      doc.moveDown(2);
      const detailsStartY = doc.y;
      const labelX = 50;
      const valueX = 180;
      const lineHeight = 22;

      doc.fontSize(11).fillColor(textColor);

      const details = [
        ["Roll No:", student.rollNo],
        ["Class:", student.class],
        ["Section:", student.section],
        ["Student's Name:", student.name],
        ["Father's Name:", student.father],
        ["Mother's Name:", student.mother],
        ["School Name:", school.name],
        ["Class Teacher:", school.classTeacher],
        ["Principal Name:", school.principal],
      ];

      let currentY = detailsStartY;
      details.forEach(([label, value]) => {
        doc.font("Helvetica-Bold").text(label, labelX, currentY, { continued: false });
        doc.font("Helvetica").text(value || "N/A", valueX, currentY);
        currentY += lineHeight;
      });

      // Exams Section
      doc.moveDown(2);
      currentY = doc.y + 10;
      doc.font("Helvetica-Bold").fontSize(12).fillColor(textColor).text("Exams to write:", labelX, currentY);
      currentY += 25;

      const examList = [
        ["IQROL", exams.IAOL],
        ["IQSOL", exams.ITSTL],
        ["IQMOL", exams.IMOL],
        ["IQGKOL", exams.IGKOL],
        ["IQEOL", exams.IENGOL],
      ];

      doc.fontSize(10);
      examList.forEach(([examName, isEnrolled]) => {
        // Exam name
        doc.font("Helvetica-Bold").fillColor(textColor).text(examName, labelX, currentY, { continued: false });
        
        // Checkbox position
        const checkboxX = labelX + 70;
        const checkboxSize = 11;
        const boxY = currentY + 1;
        
        // Draw checkbox border
        doc.lineWidth(1).strokeColor(textColor);
        doc.rect(checkboxX, boxY, checkboxSize, checkboxSize).stroke();
        
        if (isEnrolled) {
          // Fill with color
          doc.fillColor(primaryColor);
          doc.rect(checkboxX + 1, boxY + 1, checkboxSize - 2, checkboxSize - 2).fill();
          
          // Draw X mark (simpler than checkmark, more reliable)
          doc.save();
          doc.strokeColor("#ffffff").lineWidth(2);
          doc.moveTo(checkboxX + 3, boxY + 3);
          doc.lineTo(checkboxX + checkboxSize - 3, boxY + checkboxSize - 3);
          doc.stroke();
          doc.moveTo(checkboxX + checkboxSize - 3, boxY + 3);
          doc.lineTo(checkboxX + 3, boxY + checkboxSize - 3);
          doc.stroke();
          doc.restore();
        }
        
        // Status text
        const statusText = isEnrolled ? "Participating" : "Not participating";
        const statusColor = isEnrolled ? "#22c55e" : "#6b7280"; // Green for participating
        doc.font("Helvetica").fontSize(10).fillColor(statusColor);
        doc.text(statusText, checkboxX + 18, currentY, { continued: false });
        
        currentY += 22;
      });

      // Exam Center
      currentY += 10;
      doc.font("Helvetica-Bold").fontSize(11).text("Exam Center:", labelX, currentY);
      doc.font("Helvetica").text("YOUR OWN SCHOOL", valueX, currentY);

      // Instructions Section
      currentY += 40;
      doc.moveTo(40, currentY).lineTo(pageWidth - 40, currentY).stroke(borderColor);
      currentY += 15;

      doc.font("Helvetica-Bold").fontSize(12).fillColor(primaryColor).text("GENERAL INSTRUCTIONS", 0, currentY, { align: "center" });
      currentY += 25;

      doc.font("Helvetica").fontSize(9).fillColor(textColor);
      const instructions = [
        "• Please carry this admit card & its xerox copy and submit one to the invigilator on the exam day.",
        "• Use HB pencil or Black Ball Point pen only to mark your answer.",
        "• Correct way to mark your answers in OMR sheet: Fill the circle completely.",
        "• Take question paper with you after submitting the answer sheet.",
        "• For any doubt/query, contact your school coordinator.",
      ];

      instructions.forEach((instruction) => {
        doc.text(instruction, labelX, currentY, { width: contentWidth - 20 });
        currentY += 18;
      });

      // Signature Box (right side)
      const signBoxX = pageWidth - 150;
      const signBoxY = 200;
      doc.rect(signBoxX, signBoxY, 100, 120).stroke(borderColor);
      doc.fontSize(8).text("Photo", signBoxX + 35, signBoxY + 50);
      
      doc.fontSize(9).text("Principal/Head", signBoxX + 20, signBoxY + 135);
      doc.text("Sign with Seal", signBoxX + 25, signBoxY + 148);

      // Finalize PDF
      doc.end();

      writeStream.on("finish", () => {
        resolve();
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadAdmitCard(students, level, db, examDate) {
  try {
    const gfs = new GridFSBucket(db, { bucketName: "admitCards" });
    const results = [];

    for (const student of students) {
      const admitCardPath = `./outputs/admitCard_${student.studentName}-${level}-${student._id}.pdf`;
      const filename = `admitCard_${student.studentName}-${level}-${student._id}.pdf`;

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
        contentType: "application/pdf",
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
      .findOne({ filename: `admitCard_${studentName}-${level}-${studentId}.pdf` });

    if (!fileExists) {
      return res.status(404).json({ error: "Admit card not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="admitCard_${studentName}-${level}.pdf"`);
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