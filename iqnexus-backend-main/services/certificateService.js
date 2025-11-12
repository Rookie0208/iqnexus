import { MongoClient, GridFSBucket } from "mongodb";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

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

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");

    const margin = 20;
    const contentWidth = doc.page.width - 2 * margin;

    doc.lineWidth(20)
      .strokeColor("#0e8cc3")
      .rect(margin, margin, contentWidth, doc.page.height - 2 * margin)
      .stroke();

    const maxWidth = 120;
    const maxHeight = 90;
    const logoPath = path.join(__dirname, "assets", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width / 2 - maxWidth / 2, 50, {
        fit: [maxWidth, maxHeight],
        align: "center",
      });
    }

    doc.fillColor("#000000").fontSize(22).text("CERTIFICATE", {
      align: "center",
    });

    doc.moveDown(0.5);

    doc.fontSize(12).text("Presented to", { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(28).font("Helvetica-Bold").text(info["Student's Name"], {
      align: "center",
    });

    doc.moveDown(0.8);

    doc.fontSize(12).font("Helvetica").text(
      `Successfully completed the course at ${info["School"]}.`,
      { align: "center" }
    );

    doc.moveDown(3);

    const lineSize = 180;
    const signatureY = doc.page.height - 120;

    const signatureDetails = [
      { x: margin + 50, name: "Mr. Professor", title: "Professor" },
      {
        x: doc.page.width / 2 - lineSize / 2,
        name: info["Student's Name"],
        title: "Student",
      },
      {
        x: doc.page.width - margin - lineSize - 50,
        name: "Jane Doe",
        title: "Director",
      },
    ];

    doc.strokeColor("#021c27").lineWidth(1).strokeOpacity(0.4);

    signatureDetails.forEach(({ x }) => {
      doc.moveTo(x, signatureY)
        .lineTo(x + lineSize, signatureY)
        .stroke();
    });

    doc.fillOpacity(1).strokeOpacity(1);

    signatureDetails.forEach(({ x, name, title }) => {
      doc.fontSize(10).fillColor("#021c27").text(name, x, signatureY + 8, {
        width: lineSize,
        align: "center",
      });
      doc.fontSize(10).text(title, x, signatureY + 22, {
        width: lineSize,
        align: "center",
      });
    });

    doc.end();

    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}


async function generateAndUploadDocument(info, type) {
  const fileName = `${type}_${info["Student's Name"]}.pdf`;
  const outputDir = path.join(__dirname, "outputs");
  const outputPath = path.join(outputDir, fileName);

  try {
    const { bucket, client } = await getMongoBucket(type);

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
        client.close();
        resolve(fileName);
      });
      uploadStream.on("error", (err) => {
        console.error("❌ GridFS Upload Error:", err);
        client.close();
        reject(err);
      });
    });

    return fileName;
  } catch (error) {
    console.error("❌ Error generating/uploading document:", error);
    throw new Error("Operation failed");
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
    res.setHeader("Content-Type", "image/png");
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