import { STUDENT_LATEST } from "../models/newStudentModel.model.js";

import fs from "fs";
import xlsx from "xlsx";
export const updateAdvanceEntryList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // Read workbook from buffer
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Parse sheet to JSON
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validate file format
    if (!data || data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "File is empty. No data found." });
    }
    const fileColumns = Object.keys(data[0]).map(c => c.toLowerCase());
    const requiredColumns = ["roll no", "class", "school code"];
    const missingColumns = requiredColumns.filter(c => !fileColumns.includes(c));
    if (missingColumns.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: `Invalid file format. Missing required columns: ${missingColumns.join(", ")}. ` +
          `Expected columns: roll no, class, school code, IQROL2, IQSOL2, IQMOL2, IQEOL2, advanceLevelAmountPaid, advanceLevelAmountPaidOnline. ` +
          `Please use the correct template format.`
      });
    }


  for (const row of data) {
    
    const rollNo = row["roll no"];
    const studentClass = row["class"];
    const schoolCode = row["school code"];
    const updateFields = {
        IQROL2: row["IQROL2"],
        IQSOL2: row["IQSOL2"],
        IQMOL2: row["IQMOL2"],
        IQEOL2: row["IQEOL2"],
        advanceLevelAmountPaid: row["advanceLevelAmountPaid"],
        advanceLevelAmountPaidOnline: row["advanceLevelAmountPaidOnline"]
};

    
    Object.keys(updateFields).forEach((key) => {
  if (updateFields[key] === undefined || updateFields[key] === null) {
    delete updateFields[key];
  }
});
    if (!rollNo) continue;

     await STUDENT_LATEST.findOneAndUpdate(
      {
        rollNo: rollNo,
        class: studentClass,
        schoolCode: schoolCode,
        
      },
      {
        $set: updateFields
      },
      { new: true }
    );
  }

  fs.unlinkSync(filePath);
  res.status(200).json({ message: "Results uploaded successfully" });
  } catch (error) {
    console.error("❌ Error updating advance entry list:", error);
    res.status(500).json({ error: error.message || "Failed to process file" });
  }
}