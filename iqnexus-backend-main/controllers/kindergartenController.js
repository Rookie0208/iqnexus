import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { School } from "../models/schoolModel.js";
import { TeacherIncharge } from "../models/TeacherInchanrgeModel.js";
import { excelToMongoDbForKindergarten } from "../utils/excelToMongoForKGStudents.js";
import {
  kgStudentsClassQuery,
  normalizeKgClass,
  normalizeKgSection,
  KG_CLASSES,
  isKgClass,
} from "../utils/kgHelpers.js";
import fs from "fs/promises";

export const getKindergartenStudents = async (req, res) => {
  const { schoolCode, rollNo, section, class: classFilter, studentName, IQKG, exam } = req.body;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const query = { ...kgStudentsClassQuery() };
  if (schoolCode) query.schoolCode = Number(schoolCode);
  if (rollNo) query.rollNo = { $regex: rollNo.trim(), $options: "i" };
  if (section?.length > 0) query.section = { $in: section.map((s) => String(s).toUpperCase()) };
  if (classFilter) {
    const normalized = Array.isArray(classFilter)
      ? classFilter.map(normalizeKgClass).filter(Boolean)
      : [normalizeKgClass(classFilter)].filter(Boolean);
    if (normalized.length) query.class = { $in: normalized };
  }
  if (studentName) query.studentName = { $regex: studentName.trim(), $options: "i" };
  if (IQKG) query.IQKG = IQKG;

  if (exam === "IQKD1" || exam === "IQKG1" || exam === "IQKGL1") {
    query.IQKD1 = "1";
  } else if (exam === "IQKD2" || exam === "IQKG2" || exam === "IQKGL2") {
    query.IQKD2 = "1";
  }

  console.log("KG Students Query:", JSON.stringify(query));

  try {
    const students = await KINDERGARTEN_STUDENT.find(query).skip((page - 1) * limit).limit(limit).lean();
    const totalStudents = await KINDERGARTEN_STUDENT.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limit);
    console.log(`Found ${students.length} students out of ${totalStudents} total`);
    res.status(200).json({ success: true, data: students, totalPages, totalStudents, kgClasses: KG_CLASSES });
  } catch (err) {
    console.error("Error in getKindergartenStudents:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllKindergartenStudents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const base = kgStudentsClassQuery();
    const students = await KINDERGARTEN_STUDENT.find(base).skip((page - 1) * limit).limit(limit).lean();
    const totalStudents = await KINDERGARTEN_STUDENT.countDocuments(base);
    const totalPages = Math.ceil(totalStudents / limit);
    res.status(200).json({ success: true, allStudents: students, totalPages, totalStudents });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllKindergartenStudentsNoPagination = async (req, res) => {
  const { schoolCode, rollNo, section, class: classFilter, studentName, IQKG } = req.body;
  const query = { ...kgStudentsClassQuery() };

  if (schoolCode) query.schoolCode = Number(schoolCode);
  if (rollNo) query.rollNo = { $regex: rollNo.trim(), $options: "i" };
  if (section?.length > 0) query.section = { $in: section.map((s) => String(s).toUpperCase()) };
  if (classFilter) {
    const normalized = Array.isArray(classFilter)
      ? classFilter.map(normalizeKgClass).filter(Boolean)
      : [normalizeKgClass(classFilter)].filter(Boolean);
    if (normalized.length) query.class = { $in: normalized };
  }
  if (studentName) query.studentName = { $regex: studentName.trim(), $options: "i" };
  if (IQKG) query.IQKG = IQKG;

  try {
    const students = await KINDERGARTEN_STUDENT.find(query).lean();
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteKindergartenStudent = async (req, res) => {
  const { rollNo, class: className } = req.body;
  if (!rollNo) {
    return res.status(400).json({ message: "Roll number is required" });
  }

  const deleteQuery = { rollNo: rollNo.trim() };
  if (className && isKgClass(className)) {
    const normalized = normalizeKgClass(className);
    if (normalized) deleteQuery.class = normalized;
  }

  try {
    const deletedStudent = await KINDERGARTEN_STUDENT.findOneAndDelete(deleteQuery);
    if (!deletedStudent) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateKindergartenStudent = async (req, res) => {
  const {
    _id, rollNo, schoolCode, class: className, section, studentName,
    motherName, fatherName, dob, mobNo, city, IQKG, IQKD1, IQKD2, iqkdBook, Duplicates,
  } = req.body;

  if (!_id || !rollNo || !schoolCode || !section || !studentName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const normalizedClass = normalizeKgClass(className);
  if (!normalizedClass) {
    return res.status(400).json({
      message: `Invalid class. Must be one of: ${KG_CLASSES.join(", ")}`,
    });
  }

  try {
    const currentStudent = await KINDERGARTEN_STUDENT.findById(_id).lean();
    if (!currentStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updateData = {
      rollNo: rollNo.trim(),
      schoolCode: Number(schoolCode),
      class: normalizedClass,
      section: normalizeKgSection(section) || String(section).trim().toUpperCase() || "A",
      studentName: studentName.trim(),
      motherName: motherName?.trim() || "",
      fatherName: fatherName?.trim() || "",
      dob: dob?.trim() || "",
      mobNo: mobNo?.trim() || "",
      city: city?.trim() || "",
      IQKG: IQKG !== undefined ? (IQKG || "0") : (currentStudent.IQKG || "0"),
      IQKD1: IQKD1 !== undefined ? (IQKD1 || "0") : (currentStudent.IQKD1 || "0"),
      IQKD2: IQKD2 !== undefined ? (IQKD2 || "0") : (currentStudent.IQKD2 || "0"),
      iqkdBook: iqkdBook !== undefined ? (iqkdBook || "0") : (currentStudent.iqkdBook || "0"),
      Duplicates: Duplicates !== undefined ? Duplicates : currentStudent.Duplicates ?? false,
    };

    const existingStudent = await KINDERGARTEN_STUDENT.findOne({
      rollNo: rollNo.trim(),
      _id: { $ne: _id },
    });
    if (existingStudent) return res.status(400).json({ message: "Roll number already exists" });

    const updatedStudent = await KINDERGARTEN_STUDENT.findByIdAndUpdate(
      _id, { $set: updateData }, { new: true, runValidators: true }
    );
    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({ success: true, message: "Student updated successfully", data: updatedStudent });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const addKindergartenStudent = async (req, res) => {
  try {
    if (req.body.Class) {
      req.body.class = req.body.Class;
      delete req.body.Class;
    }

    const normalizedClass = normalizeKgClass(req.body.class);
    if (!normalizedClass) {
      return res.status(400).json({
        message: `Invalid class. Must be one of: ${KG_CLASSES.join(", ")}`,
      });
    }
    req.body.class = normalizedClass;
    req.body.section = normalizeKgSection(req.body.section) || String(req.body.section || "A").trim().toUpperCase();

    if (!req.body.calendarYear) {
      const { CalendarYear } = await import("../models/calendarYear.model.js");
      const currentCY = await CalendarYear.findOne({ isCurrent: true }).lean();
      if (currentCY) req.body.calendarYear = currentCY.label;
    }
    const newStudent = new KINDERGARTEN_STUDENT(req.body);
    const savedStudent = await newStudent.save();
    res.status(201).json({
      message: "Student added successfully",
      collection: savedStudent.constructor.collection.name,
      documentId: savedStudent._id,
    });
  } catch (error) {
    console.error("❌ Error adding student:", error);
    res.status(500).json({ message: "Error adding student", error: error.message });
  }
};

export const uploadKindergartenStudentsCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please upload a CSV file" });

  try {
    const response = await excelToMongoDbForKindergarten(req.file.path);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to process CSV file",
      errors: error.errors || [],
    });
  } finally {
    await fs.unlink(req.file.path).catch(err => console.error("Error deleting file:", err));
  }
};

export const getKindergartenAttendance = async (req, res) => {
  const { schoolCode, exam, section, class: classFilter } = req.body;

  if (!schoolCode || !exam) {
    return res.status(400).json({ message: "School code and exam are required" });
  }

  const query = {
    ...kgStudentsClassQuery(),
    schoolCode: Number(schoolCode),
  };

  if (exam === "IQKD1" || exam === "IQKG1" || exam === "IQKGL1") {
    query.IQKD1 = "1";
  } else if (exam === "IQKD2" || exam === "IQKG2" || exam === "IQKGL2") {
    query.IQKD2 = "1";
  }

  if (section && Array.isArray(section) && section.length > 0) {
    query.section = { $in: section.map((s) => String(s).toUpperCase()) };
  }
  if (classFilter) {
    const normalized = Array.isArray(classFilter)
      ? classFilter.map(normalizeKgClass).filter(Boolean)
      : [normalizeKgClass(classFilter)].filter(Boolean);
    if (normalized.length) query.class = { $in: normalized };
  }

  console.log("Attendance Query:", JSON.stringify(query));

  try {
    const students = await KINDERGARTEN_STUDENT.find(query).lean();
    const school = await School.findOne({ schoolCode: Number(schoolCode) }).lean();
    const examIncharge = await TeacherIncharge.findOne({
      schoolCode: Number(schoolCode),
    }).lean();

    const inchargeName = examIncharge?.examInchargeName || school?.incharge || "N/A";
    const inchargeMobNo = examIncharge?.examInchargeMobNo || school?.schoolMobNo || "N/A";
    const inchargeEmail = examIncharge?.examInchargeEmail || school?.schoolEmail || "N/A";

    res.status(200).json({
      success: true,
      data: students,
      school: school || {},
      examIncharge: {
        examInchargeName: inchargeName,
        examInchargeMobNo: inchargeMobNo,
        examInchargeEmail: inchargeEmail,
      },
    });
  } catch (err) {
    console.error("Error in getKindergartenAttendance:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
