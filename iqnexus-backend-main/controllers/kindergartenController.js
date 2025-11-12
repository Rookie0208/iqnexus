import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { excelToMongoDbForKindergarten } from "../utils/excelToMongoForKGStudents.js";
import fs from "fs/promises";

export const getKindergartenStudents = async (req, res) => {
  const { schoolCode, rollNo, section, studentName, IQKG } = req.body;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const query = { class: "KG" };
  if (schoolCode) query.schoolCode = Number(schoolCode);
  if (rollNo) query.rollNo = { $regex: rollNo.trim(), $options: "i" };
  if (section?.length > 0) query.section = { $in: section };
  if (studentName) query.studentName = { $regex: studentName.trim(), $options: "i" };
  if (IQKG) query.IQKG = IQKG;

  try {
    const students = await KINDERGARTEN_STUDENT.find(query).skip((page - 1) * limit).limit(limit).lean();
    const totalStudents = await KINDERGARTEN_STUDENT.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limit);
    res.status(200).json({ success: true, data: students, totalPages, totalStudents });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllKindergartenStudents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const students = await KINDERGARTEN_STUDENT.find({ class: "KD" }).skip((page - 1) * limit).limit(limit).lean();
    const totalStudents = await KINDERGARTEN_STUDENT.countDocuments({ class: "KD" });
    const totalPages = Math.ceil(totalStudents / limit);
    res.status(200).json({ success: true, allStudents: students, totalPages, totalStudents });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllKindergartenStudentsNoPagination = async (req, res) => {
  const { schoolCode, rollNo, section, studentName, IQKG } = req.body;
  const query = { class: "KD" };

  if (schoolCode) query.schoolCode = Number(schoolCode);
  if (rollNo) query.rollNo = { $regex: rollNo.trim(), $options: "i" };
  if (section?.length > 0) query.section = { $in: section };
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
  if (!rollNo || className !== "KD") {
    return res.status(400).json({ message: "Roll number and class (KD) are required" });
  }

  try {
    const deletedStudent = await KINDERGARTEN_STUDENT.findOneAndDelete({ rollNo: rollNo.trim(), class: "KD" });
    if (!deletedStudent) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateKindergartenStudent = async (req, res) => {
  const {
    _id, rollNo, schoolCode, section, studentName,
    motherName, fatherName, dob, mobNo, city, IQKG, Duplicates,
  } = req.body;

  if (!_id || !rollNo || !schoolCode || !section || !studentName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const updateData = {
    rollNo: rollNo.trim(),
    schoolCode: Number(schoolCode),
    class: "KG",
    section: section.trim(),
    studentName: studentName.trim(),
    motherName: motherName?.trim() || "",
    fatherName: fatherName?.trim() || "",
    dob: dob?.trim() || "",
    mobNo: mobNo?.trim() || "",
    city: city?.trim() || "",
    IQKG: IQKG || "0",
    Duplicates: Duplicates !== undefined ? Duplicates : false,
  };

  try {
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
    const newStudent = new KINDERGARTEN_STUDENT(req.body);
    const savedStudent = await newStudent.save();
    res.status(201).json({
      message: "Student added successfully",
      collection: savedStudent.constructor.collection.name,
      documentId: savedStudent._id,
    });
  } catch (error) {
    console.error("❌ Error adding student:", error);
    res.status(500).json({ message: "Error adding student", error });
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
