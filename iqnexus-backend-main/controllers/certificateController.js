import { fetchImage, generateAndUploadDocument } from "../services/certificateService.js";
import { fetchDataByMobile } from "../services/studentService.js";

const studentCache = {};

export const fetchCertificate = async (req, res) => {
  const { mobNo } = req.params;

  try {
    let studentData = studentCache[mobNo] || (await fetchDataByMobile(mobNo));
 
    // Handle both array and object responses from fetchDataByMobile
    const student = Array.isArray(studentData) ? studentData[0] : studentData;

    if (!student || !student["Mob No"]) {
      return res.status(404).json({ error: "No student found with this mobile number" });
    }
    studentCache[mobNo] = student;

    const studentName = student["Student's Name"];
    if (!studentName) {
      return res.status(400).json({ error: "Invalid student details in cache" });
    }

    fetchImage("certificate", studentName, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching certificate", details: error.message });
  }
};

export const generateDocument = async (req, res) => {
  const { type } = req.params;
  const { mobNo } = req.body;

  try {
    const rawData = studentCache[mobNo] || (await fetchDataByMobile(mobNo));
    const studentData = Array.isArray(rawData) ? rawData[0] : rawData;
    if (!studentData || !studentData["Mob No"]) {
      return res.status(404).json({ error: "No student found with this mobile number" });
    }

    studentCache[mobNo] = studentData;

    const studentName = studentData["Student's Name"];
    if (!studentName) {
      return res.status(400).json({ error: "Invalid student details in cache" });
    }

    if (!["certificate", "admitCard"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Use 'certificate' or 'admitCard'" });
    }

    const fileName = await generateAndUploadDocument(studentData, type);
    res.json({
      message: `${type} generated and uploaded successfully!`,
      fileName,
    });
  } catch (error) {
    res.status(500).json({
      error: `Error generating/uploading ${type}`,
      details: error.message,
    });
  }
};
