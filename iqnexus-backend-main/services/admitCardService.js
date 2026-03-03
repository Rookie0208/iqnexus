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

// Sanitize a string to be safe for use in filenames
function sanitizeFilename(str) {
  if (!str) return "unknown";
  return String(str)
    .replace(/[<>:"\/\\|?*]/g, "_")  // replace filesystem-illegal chars
    .replace(/\s+/g, "_")             // replace spaces
    .replace(/_{2,}/g, "_")           // collapse multiple underscores
    .replace(/^_|_$/g, "")            // trim leading/trailing underscores
    .substring(0, 80);                // cap length
}

async function generateAdmitCard(students, level, /* session, */ examDate, school) {
  try {
    const outputDir = "./outputs";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const logoPath = path.join(__dirname, "..", "assets", "logo.png");
    
    const suffix = level === "L1" ? "Basic Level" : "Advance Level";

    // Open a SINGLE DB connection for the entire batch
    const dbResponse = await dbConnection();
    if (dbResponse.status !== "success") {
      throw new Error("Database connection failed");
    }
    const db = dbResponse.conn.db;

    const results = [];
    for (const student of students) {
      try {
        const safeName = sanitizeFilename(student.studentName);
        const outputPath = `./outputs/admitCard_${safeName}-${level}-${student._id}.pdf`;
        const filename = `admitCard_${safeName}-${level}-${student._id}.pdf`;

        // Check if admit card already exists in GridFS
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
            name: student.studentName || "N/A",
            father: student.fatherName || "N/A",
            mother: student.motherName || "N/A",
            class: student.class || "N/A",
            section: student.section || "N/A",
            rollNo: student.rollNo || "N/A",
          },
          school: {
            name: school?.schoolName || "Unknown School",
            classTeacher: school?.incharge || "N/A",
            principal: school?.principalName || "N/A",
          },
          exams: { IAOL, ITSTL, IMOL, IGKOL, IENGOL },
          level: suffix,
          examDate: examDate || "N/A",
          isKindergarten: isKindergartenStudent,
        });

        if (!fs.existsSync(outputPath)) {
          console.error(`File creation failed: ${outputPath}`);
          results.push({
            success: false,
            mobNo: student.mobNo,
            error: `Failed to generate file for ${student.studentName}`,
          });
          continue;
        }
        console.log(`File created: ${outputPath}`);
        results.push({ success: true, path: outputPath, mobNo: student.mobNo });
      } catch (studentError) {
        console.error(`❌ Error generating admit card for ${student.studentName}:`, studentError.message);
        results.push({
          success: false,
          mobNo: student.mobNo,
          error: `Failed for ${student.studentName}: ${studentError.message}`,
        });
      }
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

// Pure JavaScript PDF generation using PDFKit - Professional single-page A4 Admit Card
async function generateAdmitCardPDF({ outputPath, logoPath, student, school, exams, level, examDate, isKindergarten }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 30, bottom: 0, left: 45, right: 45 },
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const mL = 45;             // marginLeft
      const mR = 45;             // marginRight
      const cW = pageWidth - mL - mR; // contentWidth

      // Colors
      const navy = "#1a237e";
      const darkGray = "#222222";
      const medGray = "#555555";
      const lightGray = "#e0e0e0";
      const accentBlue = "#0d47a1";
      const green = "#2e7d32";

      // ─── Outer double border ───
      doc.lineWidth(2).strokeColor(navy);
      doc.rect(18, 18, pageWidth - 36, pageHeight - 36).stroke();
      doc.lineWidth(0.5).strokeColor(lightGray);
      doc.rect(22, 22, pageWidth - 44, pageHeight - 44).stroke();

      // ─── Header Logo ───
      let y = 30;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (pageWidth - 100) / 2, y, { width: 100 });
        y += 58;
      } else {
        y += 8;
      }

      // ─── Title Block ───
      doc.font("Helvetica-Bold").fontSize(20).fillColor(navy);
      doc.text("ADMIT CARD", mL, y, { width: cW, align: "center", lineBreak: false });
      y += 24;

      doc.fontSize(11).fillColor(accentBlue);
      doc.text("INTERNATIONAL OLYMPIAD EXAMINATIONS", mL, y, { width: cW, align: "center", lineBreak: false });
      y += 15;

      doc.fontSize(10).fillColor(darkGray);
      doc.text(level.toUpperCase(), mL, y, { width: cW, align: "center", lineBreak: false });
      y += 14;

      // Horizontal rule
      doc.lineWidth(1.5).strokeColor(navy);
      doc.moveTo(mL, y).lineTo(pageWidth - mR, y).stroke();
      y += 8;

      // ─── Exam Date & Academic Year (single line) ───
      doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
      doc.text(`Exam Date: ${examDate || "TBA"}`, mL, y, { lineBreak: false });
      const academicYear = new Date().getMonth() >= 3
        ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
      doc.text(`Academic Year: ${academicYear}`, mL, y, { width: cW, align: "right", lineBreak: false });
      y += 16;

      // ─── Photo Box (top right) ───
      const photoBoxX = pageWidth - mR - 82;
      const photoBoxW = 72;
      const photoBoxH = 90;
      doc.lineWidth(0.8).strokeColor(navy);
      doc.rect(photoBoxX, y, photoBoxW, photoBoxH).stroke();
      doc.font("Helvetica").fontSize(7).fillColor(medGray);
      doc.text("Affix", photoBoxX, y + 32, { width: photoBoxW, align: "center", lineBreak: false });
      doc.text("Passport Photo", photoBoxX, y + 41, { width: photoBoxW, align: "center", lineBreak: false });

      // ─── Student Information Table ───
      const tableX = mL;
      const tableW = cW - photoBoxW - 14;
      const rowH = 19;
      let tableY = y;

      const details = [
        ["Roll No.", student.rollNo],
        ["Student's Name", student.name],
        ["Father's Name", student.father],
        ["Mother's Name", student.mother],
        ["Class / Section", `${student.class || "N/A"} / ${student.section || "N/A"}`],
        ["School Name", school.name],
        ["Exam Incharge", school.classTeacher],
        ["Principal", school.principal],
      ];

      const labelW = 110;
      const valueW = tableW - labelW;

      details.forEach(([label, value], i) => {
        const ry = tableY + i * rowH;
        const bgColor = i % 2 === 0 ? "#f5f5f5" : "#ffffff";

        doc.save();
        doc.rect(tableX, ry, tableW, rowH).fill(bgColor);
        doc.restore();

        doc.lineWidth(0.3).strokeColor(lightGray);
        doc.rect(tableX, ry, tableW, rowH).stroke();

        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(darkGray);
        doc.text(label, tableX + 6, ry + 5, { width: labelW - 12, lineBreak: false });

        doc.moveTo(tableX + labelW, ry).lineTo(tableX + labelW, ry + rowH).stroke();

        doc.font("Helvetica").fontSize(8.5).fillColor(darkGray);
        doc.text(String(value || "N/A"), tableX + labelW + 6, ry + 5, { width: valueW - 12, lineBreak: false });
      });

      tableY += details.length * rowH + 14;

      // ─── Exams Enrolled Table ───
      doc.font("Helvetica-Bold").fontSize(11).fillColor(navy);
      doc.text(isKindergarten ? "KINDERGARTEN EXAM ENROLLMENT" : "EXAM ENROLLMENT STATUS", mL, tableY, { width: cW, align: "center", lineBreak: false });
      tableY += 16;

      let examList;
      if (isKindergarten) {
        examList = [
          ["IQ Nexus Kindergarten Olympiad (IQKD)", exams.IAOL || exams.ITSTL || exams.IMOL || exams.IGKOL || exams.IENGOL],
        ];
      } else {
        examList = [
          ["IQ Nexus Reasoning Olympiad (IQRO)", exams.IAOL],
          ["IQ Nexus Science & Technology Olympiad (IQSO)", exams.ITSTL],
          ["IQ Nexus Mathematics Olympiad (IQMO)", exams.IMOL],
          ["IQ Nexus General Knowledge Olympiad (IQGKO)", exams.IGKOL],
          ["IQ Nexus English Olympiad (IQEO)", exams.IENGOL],
        ];
      }

      const examRowH = 19;
      const examColNameW = cW - 90;
      const examColStatusW = 90;

      // Table header
      doc.save();
      doc.rect(mL, tableY, cW, 18).fill(navy);
      doc.restore();
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
      doc.text("EXAM NAME", mL + 8, tableY + 4, { width: examColNameW - 16, lineBreak: false });
      doc.text("STATUS", mL + examColNameW, tableY + 4, { width: examColStatusW, align: "center", lineBreak: false });
      tableY += 18;

      examList.forEach(([examName, isEnrolled], i) => {
        const ry = tableY + i * examRowH;
        const bgColor = i % 2 === 0 ? "#fafafa" : "#ffffff";

        doc.save();
        doc.rect(mL, ry, cW, examRowH).fill(bgColor);
        doc.restore();

        doc.lineWidth(0.3).strokeColor(lightGray);
        doc.rect(mL, ry, cW, examRowH).stroke();

        doc.font("Helvetica").fontSize(8.5).fillColor(darkGray);
        doc.text(examName, mL + 8, ry + 5, { width: examColNameW - 16, lineBreak: false });

        // Status badge
        const badgeW = 64;
        const badgeH = 12;
        const badgeX = mL + examColNameW + (examColStatusW - badgeW) / 2;
        const badgeRY = ry + 3;

        if (isEnrolled) {
          doc.save();
          doc.roundedRect(badgeX, badgeRY, badgeW, badgeH, 3).fill(green);
          doc.restore();
          doc.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff");
          doc.text("ENROLLED", badgeX, badgeRY + 2, { width: badgeW, align: "center", lineBreak: false });
        } else {
          doc.save();
          doc.roundedRect(badgeX, badgeRY, badgeW, badgeH, 3).fill("#eeeeee");
          doc.restore();
          doc.font("Helvetica").fontSize(7).fillColor(medGray);
          doc.text("NOT ENROLLED", badgeX, badgeRY + 2, { width: badgeW, align: "center", lineBreak: false });
        }
      });

      tableY += examList.length * examRowH + 10;

      // ─── Exam Center ───
      doc.save();
      doc.rect(mL, tableY, cW, 20).fill("#e8eaf6");
      doc.restore();
      doc.lineWidth(0.5).strokeColor(navy);
      doc.rect(mL, tableY, cW, 20).stroke();
      doc.font("Helvetica-Bold").fontSize(9).fillColor(navy);
      doc.text("EXAM CENTER:", mL + 10, tableY + 5, { lineBreak: false, continued: false });
      doc.font("Helvetica").fontSize(9).fillColor(darkGray);
      doc.text("YOUR OWN SCHOOL", mL + 100, tableY + 5, { lineBreak: false });
      tableY += 28;

      // ─── Instructions Section ───
      doc.lineWidth(1).strokeColor(navy);
      doc.moveTo(mL, tableY).lineTo(pageWidth - mR, tableY).stroke();
      tableY += 8;

      doc.font("Helvetica-Bold").fontSize(10).fillColor(navy);
      doc.text("GENERAL INSTRUCTIONS", mL, tableY, { width: cW, align: "center", lineBreak: false });
      tableY += 14;

      doc.font("Helvetica").fontSize(7.5).fillColor(darkGray);
      const instructions = [
        "1.  Carry this admit card and its photocopy. Submit one copy to the invigilator on exam day.",
        "2.  Use HB pencil or Black Ball Point pen only to mark answers on the OMR sheet.",
        "3.  Fill the circle completely. Incomplete or multiple markings will not be evaluated.",
        "4.  Retain the question paper after submitting the OMR answer sheet.",
        "5.  For any queries, contact your school coordinator or the exam incharge.",
        "6.  Be seated at least 15 minutes before the scheduled exam time.",
        "7.  Electronic devices, calculators, or any unfair means are strictly prohibited.",
      ];

      instructions.forEach((text) => {
        doc.text(text, mL + 4, tableY, { width: cW - 8, lineBreak: false });
        tableY += 11;
      });

      tableY += 6;

      // ─── Signature Section ───
      doc.lineWidth(0.5).strokeColor(lightGray);
      doc.moveTo(mL, tableY).lineTo(pageWidth - mR, tableY).stroke();
      tableY += 12;

      const sigLineW = 140;
      const sigY = tableY + 18;

      // Left signature
      doc.strokeColor(darkGray).lineWidth(0.5);
      doc.moveTo(mL + 15, sigY).lineTo(mL + 15 + sigLineW, sigY).stroke();
      doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
      doc.text("Exam Incharge / Coordinator", mL + 15, sigY + 3, { width: sigLineW, align: "center", lineBreak: false });
      doc.text("(Signature & Stamp)", mL + 15, sigY + 12, { width: sigLineW, align: "center", lineBreak: false });

      // Right signature
      doc.moveTo(pageWidth - mR - 15 - sigLineW, sigY).lineTo(pageWidth - mR - 15, sigY).stroke();
      doc.text("Principal / Head of Institution", pageWidth - mR - 15 - sigLineW, sigY + 3, { width: sigLineW, align: "center", lineBreak: false });
      doc.text("(Signature & Seal)", pageWidth - mR - 15 - sigLineW, sigY + 12, { width: sigLineW, align: "center", lineBreak: false });

      // ─── Footer ───
      const footerY = pageHeight - 48;
      doc.lineWidth(1).strokeColor(navy);
      doc.moveTo(mL, footerY).lineTo(pageWidth - mR, footerY).stroke();
      doc.font("Helvetica").fontSize(6.5).fillColor(medGray);
      doc.text("This is a computer-generated document. No signature is required for validation.", mL, footerY + 5, { width: cW, align: "center", lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor(navy);
      doc.text(`© ${new Date().getFullYear()} IQ NEXUS — International Olympiad Examinations. All Rights Reserved.`, mL, footerY + 14, { width: cW, align: "center", lineBreak: false });

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
      try {
        const safeName = sanitizeFilename(student.studentName);
        const admitCardPath = `./outputs/admitCard_${safeName}-${level}-${student._id}.pdf`;
        const filename = `admitCard_${safeName}-${level}-${student._id}.pdf`;

        if (!fs.existsSync(admitCardPath)) {
          // File missing — might have been already uploaded or generation failed
          // Check if it already exists in GridFS
          const existingFile = await db
            .collection("admitCards.files")
            .findOne({ filename });
          if (existingFile) {
            results.push({
              mobNo: student.mobNo,
              success: true,
              fileId: existingFile._id,
              message: "Admit card already exists in storage",
            });
          } else {
            console.error(`File missing for upload: ${admitCardPath}`);
            results.push({
              mobNo: student.mobNo,
              success: false,
              error: "Admit card file does not exist",
            });
          }
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
          try { fs.unlinkSync(admitCardPath); } catch { /* ignore */ }
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
            try { fs.unlinkSync(admitCardPath); } catch { /* ignore */ }
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
              success: false,
              error: "Failed to upload admit card",
            });
            resolve(); // resolve instead of reject so loop continues
          });
        });
      } catch (studentError) {
        console.error(`❌ Error uploading admit card for ${student.studentName}:`, studentError.message);
        results.push({
          mobNo: student.mobNo,
          success: false,
          error: `Upload failed: ${studentError.message}`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Error processing admit cards:", error);
    return students.map((student) => ({
      mobNo: student.mobNo,
      success: false,
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
    const safeName = sanitizeFilename(studentName);
    const fileExists = await db
      .collection("admitCards.files")
      .findOne({ filename: `admitCard_${safeName}-${level}-${studentId}.pdf` });

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