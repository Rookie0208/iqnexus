import { TeacherIncharge } from "../models/TeacherInchanrgeModel.js";
import fs from "fs";
import xlsx from "xlsx";

// Get exam incharge by ID
export const getExamInchargeById = async (req, res) => {
  try {
    const examIncharge = await TeacherIncharge.findById(req.params.id);
    if (!examIncharge) {
      return res.status(404).json({
        success: false,
        message: "Exam incharge not found",
      });
    }
    res.status(200).json({
      success: true,
      data: examIncharge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createExamIncharge = async (req, res) => {
  try {
    if (req.body.schoolCode != undefined || req.body.schoolCode != '') {
      const schoolCode = Number(req.body.schoolCode);

      const className = req.body.class;

      const section = req.body.section;
      const classTeacher = req.body.classTeacher;
      const classTeacherMobNo = req.body.classTeacherMobNo;
      const classTeacherEmail = req.body.classTeacherEmail;
      const classTeacherDob = req.body.classTeacherDob;
      const examInchargeName = req.body.examInchargeName;
      const examInchargeMobNo = req.body.examInchargeMobNo;
      const examInchargeEmail = req.body.examInchargeEmail;
      const examInchargeDob = req.body.examInchargeDob;
      const inchargeModel = await TeacherIncharge.create({
        schoolCode: schoolCode,
        class: className,
        section: section,
        classTeacher: classTeacher,
        classTeacherMobNo: classTeacherMobNo,
        classTeacherEmail: classTeacherEmail,
        classTeacherDob: classTeacherDob,
        examInchargeName: examInchargeName,
        examInchargeMobNo: examInchargeMobNo,
        examInchargeEmail: examInchargeEmail,
        examInchargeDob: examInchargeDob,
      });
      await inchargeModel.save();
    } else {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);

      const workbook = xlsx.read(fileBuffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];

      // Parse sheet to JSON
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      // Validate file format
      if (!data || data.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ success: false, message: "File is empty. No data found." });
      }
      const fileColumns = Object.keys(data[0]).map(c => c.toLowerCase());
      const requiredExamCols = ["schoolcode", "class", "section", "classteacher", "classteachermobno", "classteacheremail", "examinchargename", "examinchargemobno", "examinchargeemail"];
      const missingExamCols = requiredExamCols.filter(c => !fileColumns.includes(c));
      if (missingExamCols.length > 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ 
          success: false, 
          message: `Invalid file format. Missing required columns: ${missingExamCols.join(", ")}. ` +
            `Expected columns: schoolcode, class, section, classTeacher, classTeacherMobNo, classTeacherEmail, classTeacherDob, examInchargeName, examInchargeMobNo, examInchargeEmail, examInchargeDob. ` +
            `Please use the correct template format.`
        });
      }
 

      for (const row of data) {
        const schoolcode = Number(row["schoolcode"]);
        const className = row["class"];
        const section = row["section"];
        const classTeacher = row["classTeacher"];
        const classTeacherMobNo = row["classTeacherMobNo"];
        const classTeacherEmail = row["classTeacherEmail"];
        const classTeacherDob = row["classTeacherDob"];
        const examInchargeName = row["examInchargeName"];
        const examInchargeMobNo = row["examInchargeMobNo"];
        const examInchargeEmail = row["examInchargeEmail"];
        const examInchargeDob = row["examInchargeDob"];

        if (
          !schoolcode ||
          !className ||
          !section ||
          !classTeacher ||
          !classTeacherMobNo ||
          !classTeacherEmail ||
          !examInchargeName ||
          !examInchargeMobNo ||
          !examInchargeEmail
        )
          continue;
        const inchargeModel = await TeacherIncharge.create({
          schoolCode: schoolcode,
          class: className,
          section: section,
          classTeacher: classTeacher,
          classTeacherMobNo: classTeacherMobNo,
          classTeacherEmail: classTeacherEmail,
          classTeacherDob: classTeacherDob,
          examInchargeName: examInchargeName,
          examInchargeMobNo: examInchargeMobNo,
          examInchargeEmail: examInchargeEmail,
          examInchargeDob: examInchargeDob,
        });

        await inchargeModel.save();
      }
      // Cleanup uploaded file
      fs.unlinkSync(filePath);
    }
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Error creating exam incharge:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
