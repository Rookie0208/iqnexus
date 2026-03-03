import { School } from "../models/schoolModel.js";
import { fetchSchoolNames } from "../services/studentService.js";
import { convertXlsxToMongoDbForSchool } from "../utils/excelToMongoForSchool.js";
import fs from "fs/promises";

export const getAllSchools = async (req, res) => {
  try {
    const { page, limit, search, city, sortBy, sortOrder } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    // Build filter query
    const query = {};
    if (search) {
      query.$or = [
        { schoolName: { $regex: search, $options: "i" } },
        { schoolCode: isNaN(Number(search)) ? undefined : Number(search) },
      ].filter(Boolean);
      // If search is a number, also match schoolCode exactly
      if (!isNaN(Number(search))) {
        query.$or = [
          { schoolName: { $regex: search, $options: "i" } },
          { schoolCode: Number(search) },
        ];
      }
    }
    if (city) {
      query.city = { $regex: `^${city}$`, $options: "i" };
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const totalSchools = await School.countDocuments(query);
    const totalPages = Math.ceil(totalSchools / limitNum);
    const schools = await School.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get distinct cities for dropdown filter
    const cities = await School.distinct("city");

    return res.status(200).json({ schools, totalPages, totalSchools, cities, success: true });
  } catch (error) {
    console.error("❌ Error fetching schools:", error);
    res.status(500).json({ message: "Error fetching schools", error: error.message });
  }
};

// Get all schools without pagination (for XLS download)
export const getAllSchoolsNoPagination = async (req, res) => {
  try {
    const { search, city, sortBy, sortOrder } = req.query;
    
    const query = {};
    if (search) {
      if (!isNaN(Number(search))) {
        query.$or = [
          { schoolName: { $regex: search, $options: "i" } },
          { schoolCode: Number(search) },
        ];
      } else {
        query.schoolName = { $regex: search, $options: "i" };
      }
    }
    if (city) {
      query.city = { $regex: `^${city}$`, $options: "i" };
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const schools = await School.find(query).sort(sortOptions).lean();
    return res.status(200).json({ schools, success: true });
  } catch (error) {
    console.error("❌ Error fetching all schools:", error);
    res.status(500).json({ message: "Error fetching schools", error: error.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findOne({ schoolCode: id });
    return res.status(200).json({ school, success: true });
  } catch (error) {
    console.error("❌ Error fetching school:", error);
    res.status(500).json({ message: "Error fetching school", error: error.message });
  }
};

export const getAllSchoolAdmitCards = async (req, res) => {
  try {
    const schools = await School.find({});
    return res.status(200).json({ schools, success: true });
  } catch (error) {
    console.error("❌ Error fetching school admit cards:", error);
    res.status(500).json({ message: "Error fetching schools", error: error.message });
  }
};

export const addSchool = async (req, res) => {
  try {
    const newSchool = new School(req.body);
    const savedSchool = await newSchool.save();
    return res.status(201).json({
      message: "School added successfully",
      collection: savedSchool.constructor.collection.name,
      documentId: savedSchool._id,
      success: true,
    });
  } catch (error) {
    console.error("❌ Error adding school:", error);
    res.status(500).json({ message: "Error adding school", error: error.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const { schoolCode, ...updateFields } = req.body;

    if (!schoolCode) {
      return res.status(400).json({ message: "School Code is required" });
    }

    const updatedSchool = await School.findOneAndUpdate(
      { schoolCode },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedSchool) {
      return res.status(404).json({ message: "School not found" });
    }

    return res.status(200).json({
      message: "School updated successfully",
      updatedSchool,
      success: true,
    });
  } catch (error) {
    console.error("❌ Error updating school:", error);
    res.status(500).json({ message: "Error updating school", error: error.message });
  }
};

export const deleteSchool = async (req, res) => {
  const { schoolCode } = req.params;

  if (!schoolCode) {
    return res.status(400).json({ message: "School Code is required" });
  }

  let parsedCode = parseInt(schoolCode, 10);
  if (isNaN(parsedCode)) {
    return res.status(400).json({ message: "Invalid School Code format" });
  }

  const queryCode = parsedCode;

  try {
    const deletedSchool = await School.findOneAndDelete({ schoolCode: queryCode });

    if (!deletedSchool) {
      return res.status(404).json({ message: "School not found" });
    }

    return res.status(200).json({
      message: "School deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting school:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchSchoolsByExamLevel = async (req, res) => {
  const { examLevel } = req.body;
  if (!examLevel || !["L1", "L2"].includes(examLevel)) {
    return res.status(400).json({ error: "Invalid exam level: must be L1 or L2" });
  }

  try {
    const { schoolNames, totalSchools } = await fetchSchoolNames(examLevel);

    if (totalSchools > 0) {
      return res.status(200).json({
        message: "Schools found",
        totalSchools,
        schools: schoolNames,
      });
    } else {
      return res.status(200).json({
        message: "No school found",
        totalSchools: 0,
        schools: [],
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadSchoolData = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an XLSX file" });
  }

  try {
    const response = await convertXlsxToMongoDbForSchool(req.file.path);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error uploading school data:", error);
    const isValidationError = error.message?.includes("Invalid") || 
                              error.message?.includes("Missing") || 
                              error.message?.includes("empty");
    res.status(isValidationError ? 400 : 500).json({ 
      error: error.message,
      message: error.message 
    });
  } finally {
    await fs.unlink(req.file.path).catch((err) => console.error("Error deleting file:", err));
  }
};
