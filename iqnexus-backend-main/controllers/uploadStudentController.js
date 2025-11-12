import { excelToMongoDbForStudent } from "./excelToMongoForStudent.js";

export const uploadStudentBulk = async (req, res) => {
    console.log("Reached uploadStudentBulk controller");
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV file" });
  }

  try {
    const response = await excelToMongoDbForStudent(req.file.path);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}