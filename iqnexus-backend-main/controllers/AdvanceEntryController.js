import { STUDENT_LATEST } from "../models/newStudentModel.model.js";

import fs from "fs";
import xlsx from "xlsx";
export const updateAdvanceEntryList = async (req, res) => {


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

  res.status(200).json({ message: "Results uploaded successfully" });
}