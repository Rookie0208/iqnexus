// import nodeHtmlToImage from "node-html-to-image";
// import fs from "fs";
// import path from "path";
// import mongoose from "mongoose";
// import { MongoClient, GridFSBucket } from "mongodb";
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const mongoURI = process.env.MONGO_URI;
// const dataBaseName = process.env.DATABASE_NAME;

// async function databaseConnection() {
//   const client = new MongoClient(mongoURI);
//   await client.connect();
//   return { conn: client.db(dataBaseName), status: "success" };
// }

// async function generateAdmitCard(info, level, session) {
//   try {
//     const outputDir = "./outputs";
//     clearOutputDirectory(outputDir);
//     const outputPath = `./outputs/admitCard_${info["Student's Name"]}-${level}.png`;

//     const templatePath = path.join(__dirname, "designs", "admitCard.html");
//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template file not found: ${templatePath}`);
//     }

//     const logoPath = path.join(__dirname, "assets", "logo.png");

//     const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
//     const logoSrc = `data:image/png;base64,${logoBase64}`;
//     const suffix = level.toLowerCase() === "basic" ? "Basic Level" : "Advance Level";
//     const subjectLevel = level.toLowerCase() === "basic" ? "Basic" : "Advance";
//     const IAOL = info[`IAOL ${subjectLevel}`] === "1";
//     const ITSTL = info[`ITSTL ${subjectLevel}`] === "1";
//     const IMOL = info[`IMOL ${subjectLevel}`] === "1";
//     const IGKOL = info[`IGKOL ${subjectLevel}`] === "1";
//     const IENGOL = info[`IGENOL ${subjectLevel}`] === "1";

//     await nodeHtmlToImage({
//       output: outputPath,
//       html: fs.readFileSync(templatePath, "utf8"),
//       content: {
//         logoSrc,
//         name: info["Student's Name"],
//         father: info["Father's Name"],
//         mother: info["Mother's Name"],
//         class: info["Class"],
//         section: info["Section"],
//         rollNo: info["Roll No"],
//         school: info["School"],
//         schoolCode: info["School Code"],
//         mobile: info["Mob No"],
//         city: info["City"],
//         state: info["State"],
//         country: info["Country"],
//         examCenter: info["Exam Centre"],
//         level: suffix,
//         session: session,
//         qrUrl:
//           "https://api.qrserver.com/v1/create-qr-code/?data=https://wa.me/919999999999&size=100x100",
//         IAOL,
//         ITSTL,
//         IMOL,
//         IGKOL,
//         IENGOL,
//       },
//       puppeteerArgs: {
//         args: ["--no-sandbox", "--disable-setuid-sandbox"],
//         defaultViewport: {
//           width: 900,
//           height: 1100,
//         },
//       },
//       type: "png",
//       quality: 100,
//     });

//     return { success: true, path: outputPath };
//   } catch (error) {
//     console.error("Error generating admit card:", error);
//     return { success: false, error: error.message };
//   }
// }

// function clearOutputDirectory(outputDir) {
//   if (fs.existsSync(outputDir)) {
//     fs.readdirSync(outputDir).forEach((file) => {
//       const filePath = path.join(outputDir, file);
//       fs.unlinkSync(filePath);
//     });
//   } else {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }
// }

// async function dbConnection() {
//   try {
//     const conn = await mongoose.createConnection(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     return new Promise((resolve, reject) => {
//       conn.once("open", async () => {
//         const collections = await conn.db.listCollections().toArray();
//         const collectionNames = collections.map((col) => col.name);

//         if (
//           collectionNames.includes("admitCards.files") &&
//           collectionNames.includes("admitCards.chunks")
//         ) {
//         } else {
//           new GridFSBucket(conn.db, { bucketName: "admitCards" });
//         }

//         resolve({ status: "success", conn });
//       });

//       conn.on("error", (err) => {
//         console.error("❌ MongoDB Connection Error:", err);
//         reject({ status: "failed", error: err.message });
//       });
//     });
//   } catch (error) {
//     console.error("❌ Database connection error:", error);
//     return { status: "failed", error: error.message };
//   }
// }

// async function uploadAdmitCard(studentData, res, level) {
//   try {
//     const admitCardPath = `./outputs/admitCard_${studentData["Student's Name"]}-${level}.png`;
//     if (!fs.existsSync(admitCardPath)) {
//       throw new Error("Admit card file does not exist.");
//     }

//     const dbResponse = await dbConnection();
//     if (dbResponse.status !== "success") {
//       return res.status(500).json({ error: "Database connection failed" });
//     }

//     const db = dbResponse.conn.db;
//     const gfs = new GridFSBucket(db, { bucketName: "admitCards" });

//     const existingFiles = await db
//       .collection("admitCards.files")
//       .findOne({ filename: `admitCard_${studentData["Student's Name"]}-${level}.png` });

//     if (existingFiles) {
//       return res.status(200).json({
//         message: "Admit card already exists in storage",
//         fileId: existingFiles._id,
//       });
//     }

//     const fileStream = fs.createReadStream(admitCardPath);

//     const writeStream = gfs.openUploadStream(
//       `admitCard_${studentData["Student's Name"]}-${level}.png`,
//       {
//         contentType: "image/png",
//         metadata: {
//           studentId: studentData["_id"],
//           mobNo: studentData["Mob No"],
//         },
//       }
//     );

//     fileStream.pipe(writeStream);

//     writeStream.on("finish", () => {
//       fs.unlinkSync(admitCardPath);

//       if (!res.headersSent) {
//         return res.status(200).json({
//           message: "Admit card stored successfully",
//           fileId: writeStream.id,
//         });
//       }
//     });

//     writeStream.on("error", (err) => {
//       if (!res.headersSent) {
//         res.status(500).json({ error: "Failed to upload admit card" });
//       }
//     });
//   } catch (error) {
//     console.error("❌ Error processing admit card:", error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// }

// async function fetchAdmitCardFromDB(studentName, res, level) {
//   try {
//     const dbResponse = await databaseConnection();
//     if (dbResponse.status !== "success") {
//       return res.status(500).json({ error: "Database connection failed" });
//     }

//     const db = dbResponse.conn;
//     const gfs = new GridFSBucket(db, { bucketName: "admitCards" });
//     const fileExists = await db
//       .collection("admitCards.files")
//       .findOne({ filename: `admitCard_${studentName}-${level}.png` });

//     if (!fileExists) {
//       return res.status(404).json({ error: "Admit card not found" });
//     }

//     res.setHeader("Content-Type", "image/png");
//     const readStream = gfs.openDownloadStream(fileExists._id);
//     readStream.pipe(res);
//   } catch (error) {
//     console.error("❌ Error fetching admit card:", error);
//     res.status(500).json({ error: "Failed to fetch admit card" });
//   }
// }

// export {
//   generateAdmitCard,
//   dbConnection,
//   uploadAdmitCard,
//   fetchAdmitCardFromDB,
// };

//admitcradService.js
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

function clearOutputDirectory(outputDir) {
    if (fs.existsSync(outputDir)) {
        fs.readdirSync(outputDir).forEach((file) => {
            const filePath = path.join(outputDir, file);
            fs.unlinkSync(filePath);
        });
    } else {
        fs.mkdirSync(outputDir, { recursive: true });
    }
}

async function dbConnection() {
    try {
        const conn = mongoose.createConnection(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

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

async function generateAdmitCard(students, level /*, session */) {
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
        const subjectLevel = level === "L1" ? "L1" : "L2";

        const results = [];
        for (const student of students) {
            const outputPath = `./outputs/admitCard_${student.studentName}-${level}-${student._id}.png`;

            const IAOL = student[`IAOL${subjectLevel}`] === "1";
            const ITSTL = student[`ITSTL${subjectLevel}`] === "1";
            const IMOL = student[`IMOL${subjectLevel}`] === "1";
            const IGKOL = student[`IGKOL${subjectLevel}`] === "1";
            const IENGOL = student[`IENGOL${subjectLevel}`] === "1";

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
                    school: student.school || "Unknown School",
                    state: student.state || "N/A",
                    country: student.country || "India",
                    examCenter: student.examCenter || "To Be Assigned",
                    level: suffix,
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

async function uploadAdmitCard(students, level, db) {
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

// async function fetchAdmitCardFromDB(studentName, res, level) {
//   try {
//     const dbResponse = await databaseConnection();
//     if (dbResponse.status !== "success") {
//       return res.status(500).json({ error: "Database connection failed" });
//     }

//     const db = dbResponse.conn;
//     const gfs = new GridFSBucket(db, { bucketName: "admitCards" });
//     const fileExists = await db
//       .collection("admitCards.files")
//       .findOne({ filename: `admitCard_${studentName}-${level}.png` });

//     if (!fileExists) {
//       return res.status(404).json({ error: "Admit card not found" });
//     }

//     res.setHeader("Content-Type", "image/png");
//     const readStream = gfs.openDownloadStream(fileExists._id);
//     readStream.pipe(res);
//   } catch (error) {
//     console.error("❌ Error fetching admit card:", error);
//     res.status(500).json({ error: "Failed to fetch admit card" });
//   }
// }

// const sanitize = (str) => str.replace(/[^a-zA-Z0-9-_ ]/g, '').toUpperCase().trim(); // Simple sanitization

// async function fetchAdmitCardFromDB(studentId, studentName, level, res) {
//   let db, readStream;
//   try {
//     // Get database connection
//     const dbResponse = await databaseConnection();
//     if (!dbResponse || dbResponse.status !== 'success' || !dbResponse.conn) {
//       console.error('Database connection failed:', dbResponse);
//       return res.status(500).json({ error: 'Database connection failed' });
//     }

//     // Use correct database name
//     db = dbResponse.conn.db ? dbResponse.conn.db('Epoch-olympiad-foundation') : dbResponse.conn;
//     if (!db || typeof db.collection !== 'function') {
//       console.error('Invalid database object:', db);
//       return res.status(500).json({ error: 'Invalid database object' });
//     }
//     // Ensure studentId is an ObjectId
//     let objectId;
//     try {
//       objectId = new ObjectId(studentId);
//     } catch (error) {
//       console.error('Invalid student ID format:', studentId);
//       return res.status(400).json({ error: 'Invalid student ID format' });
//     }

//     // Rest of the function remains the same
//     const gfs = new GridFSBucket(db, { bucketName: 'admitCards' });
//     const safeStudentName = sanitize(studentName || 'student');
//     const filename = `admitCard_${safeStudentName}-${level}-${studentId}.png`;

//     const file = await db.collection('admitCards.files').findOne({ filename });

//     if (!file) {
//       return res.status(404).json({ error: 'Admit card not found' });
//     }

//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename="admitCard_${safeStudentName}-${level}.png"`
//     );

//     readStream = gfs.openDownloadStream(file._id);
//     readStream.pipe(res);

//     readStream.on('error', (error) => {
//       console.error('Error streaming admit card:', error);
//       if (!res.headersSent) {
//         res.status(500).json({ error: 'Failed to stream admit card' });
//       }
//     });

//     readStream.on('end', () => {
//       console.log('Admit card streamed successfully');
//     });
//   } catch (error) {
//     console.error('Error fetching admit card:', error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: `Failed to fetch admit card: ${error.message}` });
//     }
//   } finally {
//     if (readStream) {
//       readStream.destroy();
//     }
//   }
// }


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