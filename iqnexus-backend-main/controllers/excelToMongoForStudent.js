import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import XLSX from "xlsx";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js"
import { School } from "../models/schoolModel.js";
import { CalendarYear } from "../models/calendarYear.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const renameFields = {
  "Roll No.": "rollNo",
  Duplicates: "Duplicates",
  "School Code": "schoolCode",
  "Class ": "class",
  Section: "section",
  "Student Name ": "studentName",
  "Father Name": "fatherName",
  "Mother Name": "motherName",
  DOB: "dob",
  "Mob No.": "mobNo",
  IAOL1: "IAOL1",
  "IAOL1 Book": "IAOL1Book",
  ITSTL1: "ITSTL1",
  "ITSTL1 Book": "ITSTL1Book",
  IMOL1: "IMOL1",
  "IMOL1 Book": "IMOL1Book",
  IENGOL1: "IENGOL1",
  "IENGOL1 Book": "IENGOL1Book",
  IGKOL1: "IGKOL1",
  "IGKOL1 Book": "IGKOL1Book",
  "Total Basic Level Participated Exams": "totalBasicLevelParticipatedExams",
  "Basic Level Full Amount": "basicLevelFullAmount",
  "Basic Level Paid Amount": "basicLevelAmountPaid",
  "Basic Level Amount Paid Online": "basicLevelAmountPaidOnline",
  "Is Basic Level Concession Given": "isBasicLevelConcessionGiven",
  "Concession Reason": "concessionReason",
  "Parents Working School": "ParentsWorkingschool",
  Designation: "designation",
  City: "city",
  IAOL2: "IAOL2",
  ITSTL2: "ITSTL2",
  IMOL2: "IMOL2",
  IENGOL2: "IENGOL2",
  "Advance Level Paid Amount": "advanceLevelAmountPaid",
  "Advance Level Amount Paid Online": "advanceLevelAmountPaidOnline",
  "Total Amount Paid": "totalAmountPaid",
  "Total Amount Paid Online": "totalAmountPaidOnline",
};

/**
 * Parse an XLSX/XLS file and return rows as objects with renameFields keys.
 */
function parseXlsxFile(filePath) {
  const columnNames = Object.keys(renameFields);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Get raw array data (each row is an array)
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  // Validate header row
  if (!rawData || rawData.length === 0) {
    throw new Error("File is empty. No data found.");
  }
  const headerRow = rawData[0].map(h => String(h).trim());
  const requiredHeaders = ["Roll No.", "School Code", "Student Name", "Class"];
  const missingRequired = requiredHeaders.filter(rh => 
    !headerRow.some(h => h.trim().toLowerCase() === rh.trim().toLowerCase())
  );
  if (missingRequired.length > 0) {
    throw new Error(
      `Invalid file format. Missing required columns: ${missingRequired.join(", ")}. ` +
      `Expected columns: ${columnNames.join(", ")}. ` +
      `Please download the template and use the correct format.`
    );
  }
  // Warn if column count is significantly different
  if (headerRow.length < 10) {
    throw new Error(
      `Invalid file format. Found only ${headerRow.length} columns, expected at least ${columnNames.length}. ` +
      `Please download the template and use the correct format.`
    );
  }

  const students = [];
  // Skip header row (index 0), map remaining rows to objects
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    // Skip completely empty rows
    if (!row || row.length === 0 || row.every(cell => cell === "" || cell === null || cell === undefined)) continue;

    const record = {};
    columnNames.forEach((colName, idx) => {
      record[colName] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
    });
    students.push(record);
  }

  return students;
}

/**
 * Parse a CSV file and return rows as objects with renameFields keys.
 */
async function parseCsvFile(filePath) {
  const students = [];
  const expectedColumns = Object.keys(renameFields);

  // First, read and validate the header row
  const headerLine = await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk;
      const newlineIdx = buffer.indexOf("\n");
      if (newlineIdx !== -1) {
        stream.destroy();
        resolve(buffer.substring(0, newlineIdx).trim());
      }
    });
    stream.on("end", () => resolve(buffer.trim()));
    stream.on("error", reject);
  });

  if (!headerLine) {
    throw new Error("File is empty. No data found.");
  }

  const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const requiredHeaders = ["Roll No.", "School Code", "Student Name", "Class"];
  const missingRequired = requiredHeaders.filter(rh => 
    !headers.some(h => h.trim().toLowerCase() === rh.trim().toLowerCase())
  );
  if (missingRequired.length > 0) {
    throw new Error(
      `Invalid CSV format. Missing required columns: ${missingRequired.join(", ")}. ` +
      `Expected columns: ${expectedColumns.join(", ")}. ` +
      `Please download the template and use the correct format.`
    );
  }

  const parser = fs
    .createReadStream(filePath)
    .pipe(
      parse({
        columns: expectedColumns,
        skip_lines: 1, // Skip header row
        trim: true,
      })
    );

  for await (const record of parser) {
    students.push(record);
  }

  return students;
}

export async function excelToMongoDbForStudent(filePath, originalFilename = "") {
  try {
    // Detect file type from extension
    const ext = originalFilename
      ? path.extname(originalFilename).toLowerCase()
      : path.extname(filePath).toLowerCase();

    // Parse the file (CSV or XLSX/XLS)
    let students;
    if (ext === ".xlsx" || ext === ".xls") {
      students = parseXlsxFile(filePath);
    } else {
      students = await parseCsvFile(filePath);
    }

    const invalidRecords = [];

    // Process the data according to StudentSchema
    const processedStudents = students.map((student, index) => {
      // Validate schoolCode
      let schoolCode = null;
      if (student["School Code"]) {
        const parsedCode = parseInt(student["School Code"]);
        if (!isNaN(parsedCode)) {
          schoolCode = parsedCode;
        } else {
          invalidRecords.push({
            row: index + 2, // +2 for header and 1-based indexing
            rollNo: student["Roll No."] || "unknown",
            schoolCode: student["School Code"],
            message: `Invalid schoolCode value: "${student["School Code"]}"`,
          });
        }
      }

      // Validate rollNo (required, unique)
      const rollNo = student["Roll No."] ? String(student["Roll No."]).trim() : null;
      if (!rollNo) {
        invalidRecords.push({
          row: index + 2,
          rollNo: student["Roll No."] || "unknown",
          message: "Missing or invalid rollNo",
        });
      }

      // Convert Duplicates to Boolean
      let duplicates = false;
      if (student["Duplicates"]) {
        const value = String(student["Duplicates"]).toLowerCase();
        duplicates = value === "true" || value === "1" || value === "yes";
      }

      // Map other fields, converting numbers to strings where required
      const doc = {
        rollNo: rollNo || "",
        Duplicates: duplicates,
        schoolCode,
        class: student["Class "] ? String(student["Class "]).trim() : "",
        section: student["Section"] ? String(student["Section"]).trim() : "",
        studentName: student["Student Name "] ? String(student["Student Name "]).trim() : "",
        fatherName: student["Father Name"] ? String(student["Father Name"]).trim() : "",
        motherName: student["Mother Name"] ? String(student["Mother Name"]).trim() : "",
        dob: student["DOB"] ? String(student["DOB"]).trim() : "",
        mobNo: student["Mob No."] ? String(student["Mob No."]).trim() : "",
        IAOL1: student["IAOL1"] !== undefined ? String(student["IAOL1"]).trim() : "0",
        IAOL1Book: student["IAOL1 Book"] !== undefined ? String(student["IAOL1 Book"]).trim() : "0",
        ITSTL1: student["ITSTL1"] !== undefined ? String(student["ITSTL1"]).trim() : "0",
        ITSTL1Book: student["ITSTL1 Book"] !== undefined ? String(student["ITSTL1 Book"]).trim() : "0",
        IMOL1: student["IMOL1"] !== undefined ? String(student["IMOL1"]).trim() : "0",
        IMOL1Book: student["IMOL1 Book"] !== undefined ? String(student["IMOL1 Book"]).trim() : "0",
        IENGOL1: student["IENGOL1"] !== undefined ? String(student["IENGOL1"]).trim() : "0",
        IENGOL1Book: student["IENGOL1 Book"] !== undefined ? String(student["IENGOL1 Book"]).trim() : "0",
        IGKOL1: student["IGKOL1"] !== undefined ? String(student["IGKOL1"]).trim() : "0",
        IGKOL1Book: student["IGKOL1 Book"] !== undefined ? String(student["IGKOL1 Book"]).trim() : "0",
        totalBasicLevelParticipatedExams: student["Total Basic Level Participated Exams"] !== undefined
          ? String(student["Total Basic Level Participated Exams"]).trim()
          : "0",
        basicLevelFullAmount: student["Basic Level Full Amount"] !== undefined
          ? String(student["Basic Level Full Amount"]).trim()
          : "0",
        basicLevelAmountPaid: student["Basic Level Paid Amount"] !== undefined
          ? String(student["Basic Level Paid Amount"]).trim()
          : "0",
        basicLevelAmountPaidOnline: student["Basic Level Amount Paid Online"] ? String(student["Basic Level Amount Paid Online"]).trim() : "",
        isBasicLevelConcessionGiven: student["Is Basic Level Concession Given"] ? String(student["Is Basic Level Concession Given"]).trim() : "",
        concessionReason: student["Concession Reason"] ? String(student["Concession Reason"]).trim() : "",
        ParentsWorkingschool: student["Parents Working School"] ? String(student["Parents Working School"]).trim() : "",
        designation: student["Designation"] ? String(student["Designation"]).trim() : "",
        city: student["City"] ? String(student["City"]).trim() : "",
        IAOL2: student["IAOL2"] !== undefined ? String(student["IAOL2"]).trim() : "0",
        ITSTL2: student["ITSTL2"] !== undefined ? String(student["ITSTL2"]).trim() : "0",
        IMOL2: student["IMOL2"] !== undefined ? String(student["IMOL2"]).trim() : "0",
        IENGOL2: student["IENGOL2"] !== undefined ? String(student["IENGOL2"]).trim() : "0",
        advanceLevelAmountPaid: student["Advance Level Paid Amount"] ? String(student["Advance Level Paid Amount"]).trim() : "",
        advanceLevelAmountPaidOnline: student["Advance Level Amount Paid Online"] ? String(student["Advance Level Amount Paid Online"]).trim() : "",
        totalAmountPaid: student["Total Amount Paid"] ? String(student["Total Amount Paid"]).trim() : "",
        totalAmountPaidOnline: student["Total Amount Paid Online"] ? String(student["Total Amount Paid Online"]).trim() : "",
      };

      return doc;
    });

    // Filter out records with invalid rollNo or schoolCode (required fields)
    const validStudents = processedStudents.filter((doc, index) => {
      if (!doc.rollNo || doc.schoolCode === null) {
        if (!doc.rollNo) {
          invalidRecords.push({
            row: index + 2,
            rollNo: doc.rollNo || "unknown",
            message: "Missing or invalid rollNo",
          });
        }
        if (doc.schoolCode === null) {
          invalidRecords.push({
            row: index + 2,
            rollNo: doc.rollNo || "unknown",
            schoolCode: students[index]["School Code"],
            message: `Invalid schoolCode value: "${students[index]["School Code"]}"`,
          });
        }
        return false;
      }
      return true;
    });

    // Extract unique school codes from valid students
    const uniqueSchoolCodes = [...new Set(validStudents.map(s => s.schoolCode).filter(code => code !== null))];
    
    // Verify all school codes exist in the database
    const existingSchools = await School.find({ schoolCode: { $in: uniqueSchoolCodes } }).lean();
    const existingSchoolCodes = new Set(existingSchools.map(s => s.schoolCode));
    
    // Find school codes that don't exist
    const missingSchoolCodes = uniqueSchoolCodes.filter(code => !existingSchoolCodes.has(code));
    
    if (missingSchoolCodes.length > 0) {
      // Find all students with missing school codes and add to invalid records
      const studentsWithMissingSchools = [];
      validStudents.forEach((student, index) => {
        if (missingSchoolCodes.includes(student.schoolCode)) {
          studentsWithMissingSchools.push({
            row: index + 2,
            rollNo: student.rollNo,
            schoolCode: student.schoolCode,
            message: `School with code ${student.schoolCode} does not exist in the database`,
          });
        }
      });
      
      // Return error with details about missing schools
      return {
        success: false,
        message: `Upload failed. The following school codes do not exist: ${missingSchoolCodes.join(", ")}. Please add these schools first before uploading students.`,
        missingSchoolCodes: missingSchoolCodes,
        affectedStudents: studentsWithMissingSchools,
        totalAffectedStudents: studentsWithMissingSchools.length,
      };
    }

    // Log invalid records if any
    if (invalidRecords.length > 0) {
      console.warn("Invalid student records:", invalidRecords);
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB is not connected");
    }

    // Fetch current calendar year and attach to all students
    const currentCalendarYear = await CalendarYear.findOne({ isCurrent: true }).lean();
    if (currentCalendarYear) {
      validStudents.forEach(s => { s.calendarYear = currentCalendarYear.label; });
    }

    // Insert/Update data using bulkWrite with upsert to handle duplicates gracefully
    if (validStudents.length > 0) {
      const bulkOps = validStudents.map((student) => ({
        updateOne: {
          filter: { rollNo: student.rollNo },
          update: { $set: student },
          upsert: true,
        },
      }));
      const bulkResult = await STUDENT_LATEST.bulkWrite(bulkOps, { ordered: false });
      const insertedCount = bulkResult.upsertedCount || 0;
      const updatedCount = bulkResult.modifiedCount || 0;
      console.log(
        `Successfully processed ${validStudents.length} students (${insertedCount} inserted, ${updatedCount} updated)`
      );

      return {
        success: true,
        message: `Processed ${validStudents.length} students (${insertedCount} new, ${updatedCount} updated)`,
        insertedCount,
        updatedCount,
        invalidRecords: invalidRecords.length > 0 ? invalidRecords : undefined,
      };
    } else {
      console.log("No valid student records to insert");
      return {
        success: true,
        message: `No valid student records to insert`,
        invalidRecords: invalidRecords.length > 0 ? invalidRecords : undefined,
      };
    }
  } catch (error) {
    console.error("Error processing student file:", error);
    throw error;
  }
}