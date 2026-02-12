import { excelToMongoDbForStudent } from "./excelToMongoForStudent.js";

export const uploadStudentBulk = async (req, res) => {
    console.log("Reached uploadStudentBulk controller");
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV or Excel (.xlsx) file" });
  }

  try {
    const response = await excelToMongoDbForStudent(req.file.path, req.file.originalname);
    res.status(200).json(response);
  } catch (error) {
    // Return 400 for format/validation errors, 500 for unexpected errors
    const isValidationError = error.message?.includes("Invalid") || 
                              error.message?.includes("Missing") || 
                              error.message?.includes("empty");
    res.status(isValidationError ? 400 : 500).json({ 
      error: error.message,
      message: error.message 
    });
  }
}