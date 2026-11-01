import { MongoClient, GridFSBucket } from "mongodb";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongoURI = process.env.MONGO_URI;
const CERT_BUCKET = "certificates";

/** Normalize API type aliases */
export function normalizeCertType(type) {
  const t = String(type || "participation").toLowerCase().trim();
  if (t === "certificate" || t === "participation" || t === "part") return "participation";
  if (t === "l1" || t === "basic" || t === "level1") return "l1";
  if (t === "l2" || t === "advance" || t === "advanced" || t === "level2") return "l2";
  if (t === "prize" || t === "merit" || t === "award") return "prize";
  if (t === "admitcard" || t === "admit_card") return "admitCard";
  return t;
}

export const CERT_TYPES = ["participation", "l1", "l2", "prize"];

function certCopy(type) {
  switch (normalizeCertType(type)) {
    case "l1":
      return {
        subtitle: "OF ACHIEVEMENT",
        levelLine: "Level 1 — Basic Olympiad",
        body1: "for outstanding performance in the Level 1 (Basic) International Olympiad Examinations",
      };
    case "l2":
      return {
        subtitle: "OF ACHIEVEMENT",
        levelLine: "Level 2 — Advanced Olympiad",
        body1: "for outstanding performance in the Level 2 (Advanced) International Olympiad Examinations",
      };
    case "prize":
      return {
        subtitle: "OF MERIT",
        levelLine: "Prize / Award Winner",
        body1: "for meritorious performance and prize achievement in the International Olympiad Examinations",
      };
    case "participation":
    default:
      return {
        subtitle: "OF PARTICIPATION",
        levelLine: "",
        body1: "for successful participation in the International Olympiad Examinations",
      };
  }
}

async function getMongoBucket() {
  const dbName = process.env.DATABASE_NAME;
  const client = await MongoClient.connect(mongoURI);
  const db = client.db(dbName);
  return { bucket: new GridFSBucket(db, { bucketName: CERT_BUCKET }), client, db };
}

function studentDisplayName(info) {
  return (
    info["Student's Name"] ||
    info.studentName ||
    info.name ||
    "Student"
  );
}

function studentSchool(info) {
  return info["School"] || info.schoolName || info.school || "their school";
}

function studentMob(info) {
  return String(info["Mob No"] || info.mobNo || info.mobile || "").trim();
}

function studentRoll(info) {
  return String(info.rollNo || info["Roll No"] || "").trim();
}

export function buildCertFilename(type, info) {
  const certType = normalizeCertType(type);
  const mob = studentMob(info).replace(/\D/g, "") || "unknown";
  const roll = studentRoll(info).replace(/[^\w.-]/g, "") || "noroll";
  return `${certType}_${mob}_${roll}.pdf`;
}

/**
 * Draw one certificate page onto an open PDFDocument
 */
function drawCertificatePage(doc, info, type) {
  const copy = certCopy(type);
  const W = doc.page.width;
  const H = doc.page.height;
  const margin = 30;
  const contentWidth = W - 2 * margin;

  const navy = "#1a237e";
  const gold = "#c49b2f";
  const darkGray = "#222222";
  const medGray = "#555555";

  doc.rect(0, 0, W, H).fill("#ffffff");

  doc.lineWidth(3).strokeColor(navy);
  doc.rect(margin, margin, contentWidth, H - 2 * margin).stroke();
  doc.lineWidth(1).strokeColor(gold);
  doc.rect(margin + 5, margin + 5, contentWidth - 10, H - 2 * margin - 10).stroke();

  doc.lineWidth(2).strokeColor(gold);
  doc.moveTo(margin + 20, margin + 15).lineTo(W - margin - 20, margin + 15).stroke();
  doc.moveTo(margin + 20, H - margin - 15).lineTo(W - margin - 20, H - margin - 15).stroke();

  let headerY = margin + 25;
  const logoPath = path.join(__dirname, "..", "assets", "logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, W / 2 - 55, headerY, { width: 110 });
    headerY += 65;
  } else {
    headerY += 10;
  }

  doc.font("Helvetica-Bold").fontSize(14).fillColor(navy);
  doc.text("IQ NEXUS", margin, headerY, { width: contentWidth, align: "center" });
  headerY += 18;

  doc.font("Helvetica").fontSize(9).fillColor(medGray);
  doc.text("INTERNATIONAL OLYMPIAD EXAMINATIONS", margin, headerY, {
    width: contentWidth,
    align: "center",
  });
  headerY += 20;

  doc.font("Helvetica-Bold").fontSize(28).fillColor(navy);
  doc.text("CERTIFICATE", margin, headerY, { width: contentWidth, align: "center" });
  headerY += 36;

  doc.font("Helvetica").fontSize(11).fillColor(medGray);
  doc.text(copy.subtitle, margin, headerY, { width: contentWidth, align: "center" });
  headerY += 16;

  if (copy.levelLine) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(gold);
    doc.text(copy.levelLine, margin, headerY, { width: contentWidth, align: "center" });
    headerY += 16;
  } else {
    headerY += 6;
  }

  const lineCenter = W / 2;
  doc.lineWidth(1.5).strokeColor(gold);
  doc.moveTo(lineCenter - 80, headerY).lineTo(lineCenter + 80, headerY).stroke();
  headerY += 18;

  doc.font("Helvetica").fontSize(12).fillColor(medGray);
  doc.text("This certificate is proudly presented to", margin, headerY, {
    width: contentWidth,
    align: "center",
  });
  headerY += 24;

  const studentName = studentDisplayName(info);
  doc.font("Helvetica-Bold").fontSize(26).fillColor(navy);
  doc.text(studentName.toUpperCase(), margin, headerY, {
    width: contentWidth,
    align: "center",
  });
  headerY += 34;

  doc.lineWidth(0.5).strokeColor(gold);
  doc.moveTo(lineCenter - 120, headerY).lineTo(lineCenter + 120, headerY).stroke();
  headerY += 18;

  const schoolName = studentSchool(info);
  const examLine = info.examLabel || info.subject || "";
  const scoreLine =
    info.score != null
      ? `Score: ${info.score}${info.percentage != null ? ` (${info.percentage}%)` : ""}`
      : "";
  const rankLine = info.rankLabel || "";

  doc.font("Helvetica").fontSize(11).fillColor(darkGray);
  doc.text(copy.body1, margin + 40, headerY, {
    width: contentWidth - 80,
    align: "center",
  });
  headerY += 16;
  doc.text(`conducted by IQ Nexus at ${schoolName}.`, margin + 40, headerY, {
    width: contentWidth - 80,
    align: "center",
  });
  headerY += 14;

  if (examLine) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(navy);
    doc.text(examLine, margin + 40, headerY, {
      width: contentWidth - 80,
      align: "center",
    });
    headerY += 14;
  }
  if (scoreLine || rankLine) {
    doc.font("Helvetica").fontSize(10).fillColor(darkGray);
    doc.text([scoreLine, rankLine].filter(Boolean).join("  ·  "), margin + 40, headerY, {
      width: contentWidth - 80,
      align: "center",
    });
    headerY += 14;
  }

  headerY += 10;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.font("Helvetica").fontSize(9).fillColor(medGray);
  doc.text(`Date: ${dateStr}`, margin, headerY, {
    width: contentWidth,
    align: "center",
  });

  const sigLineW = 160;
  const sigY = H - margin - 70;
  doc.lineWidth(0.5).strokeColor(darkGray);

  const leftSigX = margin + 60;
  doc.moveTo(leftSigX, sigY).lineTo(leftSigX + sigLineW, sigY).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
  doc.text("Exam Incharge", leftSigX, sigY + 5, { width: sigLineW, align: "center" });
  doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
  doc.text("(Signature & Stamp)", leftSigX, sigY + 16, {
    width: sigLineW,
    align: "center",
  });

  const centerSigX = W / 2 - sigLineW / 2;
  doc.moveTo(centerSigX, sigY).lineTo(centerSigX + sigLineW, sigY).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
  doc.text(studentName, centerSigX, sigY + 5, { width: sigLineW, align: "center" });
  doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
  doc.text("(Student)", centerSigX, sigY + 16, { width: sigLineW, align: "center" });

  const rightSigX = W - margin - 60 - sigLineW;
  doc.moveTo(rightSigX, sigY).lineTo(rightSigX + sigLineW, sigY).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(darkGray);
  doc.text("Director", rightSigX, sigY + 5, { width: sigLineW, align: "center" });
  doc.font("Helvetica").fontSize(7.5).fillColor(medGray);
  doc.text("(IQ Nexus)", rightSigX, sigY + 16, { width: sigLineW, align: "center" });

  doc.font("Helvetica").fontSize(7).fillColor(medGray);
  doc.text(
    `© ${now.getFullYear()} IQ NEXUS — International Olympiad Examinations. All Rights Reserved.`,
    margin,
    H - margin - 25,
    { width: contentWidth, align: "center" }
  );
}

async function generatePDF(info, outputPath, type) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4" });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    drawCertificatePage(doc, info, type);
    doc.end();
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

/**
 * Build a multi-page PDF buffer (one page per student) for bulk download.
 */
export async function generateBulkPdfBuffer(students, type) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4", autoFirstPage: false });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    for (const info of students) {
      doc.addPage({ layout: "landscape", size: "A4" });
      drawCertificatePage(doc, info, type);
    }
    if (students.length === 0) {
      doc.addPage({ layout: "landscape", size: "A4" });
      doc.font("Helvetica").fontSize(14).text("No students found for certificate generation.", 50, 50);
    }
    doc.end();
  });
}

async function generateAndUploadDocument(info, type, { force = false } = {}) {
  const certType = normalizeCertType(type);
  if (certType === "admitCard") {
    throw new Error("Use admit-card endpoints for admit cards");
  }
  if (!CERT_TYPES.includes(certType)) {
    throw new Error(`Invalid certificate type: ${type}`);
  }

  const fileName = buildCertFilename(certType, info);
  const outputDir = path.join(__dirname, "outputs");
  const outputPath = path.join(outputDir, fileName);
  let client = null;

  try {
    const result = await getMongoBucket();
    const bucket = result.bucket;
    client = result.client;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const existingFile = await bucket.find({ filename: fileName }).toArray();
    if (existingFile.length > 0 && !force) {
      return fileName;
    }
    // Remove old versions when regenerating
    for (const f of existingFile) {
      try {
        await bucket.delete(f._id);
      } catch {
        /* ignore */
      }
    }

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    await generatePDF(info, outputPath, certType);

    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(outputPath);
      const uploadStream = bucket.openUploadStream(fileName, {
        metadata: {
          type: certType,
          mobNo: studentMob(info),
          rollNo: studentRoll(info),
          studentName: studentDisplayName(info),
          schoolCode: info.schoolCode || info["School Code"] || null,
          createdAt: new Date(),
        },
      });
      readStream.pipe(uploadStream);
      uploadStream.on("finish", () => resolve(fileName));
      uploadStream.on("error", (err) => {
        console.error("❌ GridFS Upload Error:", err);
        reject(err);
      });
    });

    return fileName;
  } catch (error) {
    console.error("❌ Error generating/uploading document:", error);
    throw error;
  } finally {
    if (client) {
      try {
        client.close();
      } catch {
        /* ignore */
      }
    }
  }
}

async function fetchImage(type, nameOrFileHint, res, { mobNo, rollNo } = {}) {
  const certType = normalizeCertType(type);
  if (certType === "admitCard") {
    return res.status(400).json({ error: "Use admit-card endpoints for admit cards" });
  }
  if (![...CERT_TYPES, "certificate"].includes(certType) && certType !== "participation") {
    return res
      .status(400)
      .json({ error: "Invalid type. Use participation | l1 | l2 | prize" });
  }

  let client = null;
  try {
    const result = await getMongoBucket();
    const bucket = result.bucket;
    client = result.client;

    let files = [];
    // Prefer metadata lookup
    if (mobNo || rollNo) {
      const metaQuery = { "metadata.type": certType === "certificate" ? "participation" : certType };
      if (mobNo) metaQuery["metadata.mobNo"] = String(mobNo);
      if (rollNo) metaQuery["metadata.rollNo"] = String(rollNo);
      files = await bucket.find(metaQuery).sort({ uploadDate: -1 }).limit(1).toArray();
    }

    // Legacy filename patterns
    if (files.length === 0 && nameOrFileHint) {
      const candidates = [
        buildCertFilename(certType, {
          "Mob No": mobNo,
          rollNo,
          "Student's Name": nameOrFileHint,
        }),
        `certificate_${nameOrFileHint}.pdf`,
        `participation_${nameOrFileHint}.pdf`,
        `${certType}_${nameOrFileHint}.pdf`,
      ];
      for (const fn of candidates) {
        const found = await bucket.find({ filename: fn }).toArray();
        if (found.length) {
          files = found;
          break;
        }
      }
      // Also search default fs bucket for legacy participation certs
      if (files.length === 0) {
        const legacy = new GridFSBucket(result.db);
        const legacyFiles = await legacy
          .find({ filename: `certificate_${nameOrFileHint}.pdf` })
          .toArray();
        if (legacyFiles.length > 0) {
          const downloadStream = legacy.openDownloadStreamByName(
            `certificate_${nameOrFileHint}.pdf`
          );
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `inline; filename="certificate_${nameOrFileHint}.pdf"`
          );
          downloadStream.on("end", () => client.close());
          downloadStream.on("error", () => {
            client.close();
            if (!res.headersSent) res.status(500).json({ error: "Error retrieving file" });
          });
          return downloadStream.pipe(res);
        }
      }
    }

    if (files.length === 0) {
      client.close();
      return res.status(404).json({ error: "File not found" });
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(file._id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.filename}"`
    );
    downloadStream.on("end", () => client.close());
    downloadStream.on("error", (err) => {
      console.error(`❌ Error streaming file: ${err}`);
      client.close();
      if (!res.headersSent) res.status(500).json({ error: "Error retrieving file" });
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    if (client) try { client.close(); } catch { /* ignore */ }
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
}

export { generateAndUploadDocument, fetchImage, generatePDF, drawCertificatePage };
