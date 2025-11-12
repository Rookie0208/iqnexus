import fs from "fs";
import { parse } from "csv-parse";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js"
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

export async function excelToMongoDbForStudent(filePath) {
  try {
    // Read and parse the CSV file
    const students = [];
    const invalidRecords = [];
    const parser = fs
      .createReadStream(filePath)
      .pipe(
        parse({
          columns: Object.keys(renameFields),
          skip_lines: 1, // Skip header row
          trim: true,
        })
      );

    for await (const record of parser) {
      students.push(record);
    }

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

    // Log invalid records if any
    if (invalidRecords.length > 0) {
      console.warn("Invalid student records:", invalidRecords);
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB is not connected");
    }

    // Insert data
    if (validStudents.length > 0) {
      await STUDENT_LATEST.insertMany(validStudents, { ordered: false });
      console.log(
        `Successfully inserted ${validStudents.length} students into MongoDB`
      );
    } else {
      console.log("No valid student records to insert");
    }

    return {
      success: true,
      message: `Inserted ${validStudents.length} students`,
      invalidRecords: invalidRecords.length > 0 ? invalidRecords : undefined,
    };
  } catch (error) {
    console.error("Error processing student CSV file:", error);
    throw error;
  }
}