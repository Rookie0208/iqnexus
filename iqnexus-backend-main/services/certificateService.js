import { MongoClient, GridFSBucket } from "mongodb";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongoURI = process.env.MONGO_URI;

async function getMongoBucket(type) {
  const dbName = process.env.DATABASE_NAME;
  const client = await MongoClient.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db(dbName);

  return { bucket: new GridFSBucket(db), client };
}

async function generatePDF(info, outputPath, type) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4" });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28
    const margin = 30;
    const contentWidth = W - 2 * margin;

    // Colors
    const navy = "#1a237e";
    const gold = "#c49b2f";
    const darkGray = "#222222";
    const medGray = "#555555";
    const lightGold = "#fdf6e3";

    // ─── Background ───
    doc.rect(0, 0, W, H).fill("#ffffff");

    // ─── Outer decorative border (double line) ───
    doc.lineWidth(3).strokeColor(navy);
    doc.rect(margin, margin, contentWidth, H - 2 * margin).stroke();
    doc.lineWidth(1).strokeColor(gold);
    doc.rect(margin + 5, margin + 5, contentWidth - 10, H - 2 * margin - 10).stroke();

    // ─── Gold accent lines at top and bottom ───
    doc.lineWidth(2).strokeColor(gold);
    doc.moveTo(margin + 20, margin + 15).lineTo(W - margin - 20, margin + 15).stroke();
    doc.moveTo(margin + 20, H - margin - 15).lineTo(W - margin - 20, H - margin - 15).stroke();

    // ─── Logo ───
    let headerY = margin + 25;
    const logoPath = path.join(__dirname, "..", "assets", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, W / 2 - 55, headerY, { width: 110 });
      headerY += 65;
    } else {
      headerY += 10;
    }

    // ─── Organization Name ───
    doc.font("Helvetica-Bold").fontSize(14).fillColor(navy);
    doc.text("IQ NEXUS", margin, headerY, { width: contentWidth, align: "center" });
    headerY += 18;

    doc.font("Helvetica").fontSize(9).fillColor(medGray);
    doc.text("INTERNATIONAL OLYMPIAD EXAMINATIONS", margin, headerY, { width: contentWidth, align: "center" });
    headerY += 20;

    // ─── Certificate Title ───
    doc.font("Helvetica-Bold").fontSize(28).fillColor(navy);
    doc.text("CERTIFICATE", margin, headerY, { width: contentWidth, align: "center" });
    headerY += 36;

    doc.font("Helvetica").fontSize(11).fillColor(medGray);
    doc.text("OF PARTICIPATION", margin, headerY, { width: contentWidth, align: "center" });
    headerY += 22;

    // ─── Decorative line under title ───
    const lineCenter = W / 2;
    doc.lineWidth(1.5).strokeColor(gold);
    doc.moveTo(lineCenter - 80, headerY).lineTo(lineCenter + 80, headerY).stroke();
    headerY += 18;

    // ─── Presented to ───
    doc.font("Helvetica").fontSize(12).fillColor(medGray);
    doc.text("This certificate is proudly presented to", margin, headerY, { width: contentWidth, align: "center" });
    headerY += 24;

    // ─── Student Name ───
    const studentName = info["Student's Name"] || "Student";
    doc.font("Helvetica-Bold").fontSize(26).fillColor(navy);
    doc.text(studentName.toUpperCase(), margin, headerY, { width: contentWidth, align: "center" });
    headerY += 34;

    // ─── Line under name ───
    doc.lineWidth(0.5).strokeColor(gold);
    doc.moveTo(lineCenter - 120, headerY).lineTo(lineCenter + 120, headerY).stroke();
    headerY += 18;

    // ─── Description ───
    const schoolName = info["School"] || "their school";
    doc.font("Helvetica").fontSize(11).fillColor(darkGray);
    doc.text(
      `for successful participation in the International Olympiad Examinations`,
      margin + 40, headerY, { width: contentWidth - 80, align: "center" }
    );
    headerY += 16;
    doc.text(
      `conducted by IQ Nexus at ${schoolName}.`,
      margin + 40, headerY, { width: contentWidth - 80, align: "center" }
    );
    headerY += 30;

    // ─── Date ───
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    doc.font("Helvetica").fontSize(9).fillColor(medGray);
    doc.text(`Date: ${dateStr}`, margin, headerY, { width: contentWidth, align: "center" });
    headerY += 30;

    // ─── Signature Section ───
    const sigLineW = 160;
    const sigY = H - margin - 70;

    doc.lineWidth(0.5).strokeColor(darkGray);

    // Left signature
    const leftSigX = margin + 60;
    doc.moveTo(leftSigX, sigY).lineTo(leftSigX + sigLineW, sigY).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
    doc.text("Exam Incharge", leftSigX, sigY + 5, { width: sigLineW, align: "center" });
    doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
    doc.text("(Signature & Stamp)", leftSigX, sigY + 16, { width: sigLineW, align: "center" });

    // Center signature
    const centerSigX = W / 2 - sigLineW / 2;
    doc.moveTo(centerSigX, sigY).lineTo(centerSigX + sigLineW, sigY).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
    doc.text(studentName, centerSigX, sigY + 5, { width: sigLineW, align: "center" });
    doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
    doc.text("(Student)", centerSigX, sigY + 16, { width: sigLineW, align: "center" });

    // Right signature
    const rightSigX = W - margin - 60 - sigLineW;
    doc.moveTo(rightSigX, sigY).lineTo(rightSigX + sigLineW, sigY).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
    doc.text("Director", rightSigX, sigY + 5, { width: sigLineW, align: "center" });
    doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
    doc.text("(IQ Nexus)", rightSigX, sigY + 16, { width: sigLineW, align: "center" });

    // ─── Footer ───
    doc.font("Helvetica").fontSize(7).fillColor(medGray);
    doc.text(`© ${now.getFullYear()} IQ NEXUS — International Olympiad Examinations. All Rights Reserved.`, margin, H - margin - 25, { width: contentWidth, align: "center" });

    doc.end();

    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}


async function generateAndUploadDocument(info, type) {
  const fileName = `${type}_${info["Student's Name"]}.pdf`;
  const outputDir = path.join(__dirname, "outputs");
  const outputPath = path.join(outputDir, fileName);
  let client = null;

  try {
    const result = await getMongoBucket(type);
    const bucket = result.bucket;
    client = result.client;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const existingFile = await bucket.find({ filename: fileName }).toArray();
    if (existingFile.length > 0) {
      client.close();
      return fileName;
    }

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    await generatePDF(info, outputPath, type);

   

    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(outputPath);
      const uploadStream = bucket.openUploadStream(fileName);
      readStream.pipe(uploadStream);
      uploadStream.on("finish", () => {
        resolve(fileName);
      });
      uploadStream.on("error", (err) => {
        console.error("❌ GridFS Upload Error:", err);
        reject(err);
      });
    });

    return fileName;
  } catch (error) {
    console.error("❌ Error generating/uploading document:", error);
    throw new Error("Operation failed");
  } finally {
    if (client) {
      try { client.close(); } catch (e) { /* ignore */ }
    }
  }
}

async function fetchImage(type, name, res) {
  if (!["certificate", "admitCard"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Use 'certificate' or 'admitCard'" });
  }
  try {
    const { bucket, client } = await getMongoBucket(type);
    const fileName = `${type}_${name}.pdf`;
    const files = await bucket.find({ filename: fileName }).toArray();
    if (files.length === 0) {
      client.close();
      return res.status(404).json({ error: "File not found" });
    }
    const downloadStream = bucket.openDownloadStreamByName(fileName);
    res.setHeader("Content-Type", "application/pdf");
    downloadStream.on("data", () => console.log(`📥 Streaming file: ${fileName}`));
    downloadStream.on("end", () => {
      console.log(`✅ File streaming completed: ${fileName}`);
      client.close();
    });
    downloadStream.on("error", (err) => {
      console.error(`❌ Error streaming file: ${err}`);
      client.close();
      res.status(500).json({ error: "Error retrieving file" });
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export { generateAndUploadDocument, fetchImage };