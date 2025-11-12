import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import fs from "fs";
import xlsx from "xlsx";
const examNameMapping = {
  IQMO: "IMO",
  IQSO: "ITST",
  IQEO: "IENGO",
  IQRO: "IAO",
  IQGKO: "IGKO",
};

export const uploadResult = async (req, res) => {
  const filePath = req.file.path;

  const fileBuffer = fs.readFileSync(filePath);

  // Read workbook from buffer
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });

  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];

  // Parse sheet to JSON
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(data);
  const { subject, studentClass, schoolCode } = req.body;

  const resultKey = subject;

  for (const row of data) {
    const rollNo = row["roll no"];
    const marksObtained = Number(row["marks obtained"]);
    const totalMarks = Number(row["total marks"]);
    const passOrFail= row["pass or fail"];

    if (!rollNo || isNaN(marksObtained) || isNaN(totalMarks)) continue;

     await STUDENT_LATEST.findOneAndUpdate(
      {
        rollNo: rollNo,
        class: studentClass,
        schoolCode: schoolCode,
        
      },
      {
        $set: {
          [`result.${resultKey}.marksObtained`]: marksObtained,
          [`result.${resultKey}.totalMarks`]: totalMarks,
          [`result.${resultKey}.passOrFail`]: passOrFail,
   
        },
      },
      { new: true }
    );
  }

  res.status(200).json({ message: "Results uploaded successfully" });
};

export const getResult = async (req, res) => {
  const { rollNo, class: studentClass } = req.query;
  if (!rollNo || !studentClass) {
    return res
      .status(400)
      .json({ error: "Roll number and class are required" });
  }
  try {
    const student = await STUDENT_LATEST.findOne(
      {
        rollNo: rollNo,
        class: studentClass,
      },
      { result: 1, _id: 0 }
    );
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json(student.result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

