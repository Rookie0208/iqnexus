import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js"
import fs from "fs";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import { promises as fsPromises } from "fs";

export async function excelToMongoDbForKindergarten(filePath) {
    try {
        const renameFields = {

            "Roll No": "rollNo",
            "School Code": "schoolCode",
            Class: "class",
            Section: "section",
            "Student Name": "studentName",
            "Father Name": "fatherName",
            "Mother Name": "motherName",
            DOB: "dob",
            "Mob No": "mobNo",
            "IQKD Book": "iqkdBook",
            "Total Basic Level Participated Exams": "totalBasicLevelParticipatedExams",
            "Basic Level Full Amount": "basicLevelFullAmount",
            "Basic Level Paid Amount": "basicLevelAmountPaid",
            "Is Basic Level Concession Given": "isBasicLevelConcessionGiven",
            "Concession Reason": "concessionReason",
            "Parents Working School": "ParentsWorkingschool",
            Designation: "designation",
            City: "city",
            "Advance Level Paid Amount": "advanceLevelAmountPaid",
            "Advance Level Amount Paid Online": "advanceLevelAmountPaidOnline",
            "Total Amount Paid": "totalAmountPaid",
            "Total Amount Paid Online": "totalAmountPaidOnline",
        };

        const requiredColumns = ["studentName", "rollNo", "schoolCode", "section"];
        const optionalColumns = [
            "motherName",
            "fatherName",
            "dob",
            "mobNo",
            "city",
            "IQKD Book",
            "class",
        ];
        const allColumns = [...requiredColumns, ...optionalColumns];

        const students = [];
        let headers = [];

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(
                    parse({
                        columns: (header) =>
                            header.map((h) => renameFields[h.trim()] || h.trim()),
                        trim: true,
                        skip_empty_lines: true,
                    })
                )
                .on("headers", (headerList) => {
                    headers = headerList;
                    console.log("CSV Headers:", headers); // Debug headers
                    const missingColumns = requiredColumns.filter(
                        (col) => !headers.includes(col)
                    );
                    if (missingColumns.length > 0) {
                        reject(
                            new Error(`Missing required columns: ${missingColumns.join(", ")}`)
                        );
                    }
                    const unexpectedColumns = headers.filter(
                        (col) => !allColumns.includes(col)
                    );
                    if (unexpectedColumns.length > 0) {
                        console.warn(
                            `Unexpected columns ignored: ${unexpectedColumns.join(", ")}`
                        );
                    }
                })
                .on("data", (row) => {
                    console.log("CSV Row:", row);
                    students.push(row);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        // Validate and transform student data
        const validSections = ["LK", "UK", "PG"];
        const invalidRecords = [];
        const processedStudents = students.map((student, index) => {
            const rowNum = index + 2;
            const errors = [];

            if (!student.studentName) {
                errors.push(`Row ${rowNum}: studentName is required`);
            }
            if (!student.rollNo) {
                errors.push(`Row ${rowNum}: rollNo is required`);
            }

            let schoolCode = null;
            if (student.schoolCode) {
                const parsedCode = parseInt(student.schoolCode);
                if (!isNaN(parsedCode)) {
                    schoolCode = parsedCode;
                } else {
                    errors.push(
                        `Row ${rowNum}: schoolCode must be a number, got "${student.schoolCode}"`
                    );
                }
            } else {
                errors.push(`Row ${rowNum}: schoolCode is required`);
            }

            if (!student.section || !validSections.includes(student.section)) {
                errors.push(`Row ${rowNum}: section must be LK, UK, or PG`);
            }

            if (student.class && student.class !== "KD") {
                errors.push(`Row ${rowNum}: class must be KD`);
            }

            if (errors.length > 0) {
                invalidRecords.push({
                    row: rowNum,
                    rollNo: student.rollNo || "unknown",
                    errors,
                });
            }

            return {
                rollNo: student.rollNo?.trim() || "",
                schoolCode,
                class: "KD",
                section: student.section?.trim() || "",
                studentName: student.studentName?.trim() || "",
                fatherName: student.fatherName?.trim() || "",
                motherName: student.motherName?.trim() || "",
                dob: student.dob?.trim() || "",
                mobNo: student.mobNo?.trim() || "",
                iqkdBook: student.iqkdBook?.trim() || "",
                totalBasicLevelParticipatedExams: student.totalBasicLevelParticipatedExams?.trim() || "",
                basicLevelFullAmount: student.basicLevelFullAmount?.trim() || "",
                basicLevelAmountPaid: student.basicLevelAmountPaid?.trim() || "",
                isBasicLevelConcessionGiven: student.isBasicLevelConcessionGiven?.trim() || "",
                concessionReason: student.concessionReason?.trim() || "",
                ParentsWorkingschool: student.ParentsWorkingschool?.trim() || "",
                designation: student.designation?.trim() || "",
                city: student.city?.trim() || "",
                advanceLevelAmountPaid: student.advanceLevelAmountPaid?.trim() || "",
                advanceLevelAmountPaidOnline: student.advanceLevelAmountPaidOnline?.trim() || "",
                totalAmountPaid: student.totalAmountPaid?.trim() || "",
                totalAmountPaidOnline: student.totalAmountPaidOnline?.trim() || "",
            };
        });

        const validStudents = processedStudents.filter((student) => {
            return (
                student.rollNo &&
                student.schoolCode !== null &&
                student.studentName &&
                student.section
            );
        });

        if (invalidRecords.length > 0) {
            console.warn("Invalid kindergarten student records:", invalidRecords);
        }

        if (mongoose.connection.readyState !== 1) {
            throw new Error("MongoDB is not connected");
        }

        const rollNos = validStudents.map((s) => s.rollNo);
        const duplicateRollNos = rollNos.filter(
            (rollNo, index) => rollNos.indexOf(rollNo) !== index
        );
        if (duplicateRollNos.length > 0) {
            throw new Error(
                `Duplicate roll numbers found in CSV: ${[...new Set(duplicateRollNos)].join(
                    ", "
                )}`
            );
        }

        const existingStudents = await KINDERGARTEN_STUDENT.find({
            rollNo: { $in: rollNos },
        }).select("rollNo");
        const existingRollNos = existingStudents.map((s) => s.rollNo);
        if (existingRollNos.length > 0) {
            throw new Error(
                `Some roll numbers already exist in the database: ${existingRollNos.join(
                    ", "
                )}`
            );
        }

        let insertedCount = 0;
        if (validStudents.length > 0) {
            const insertedStudents = await KINDERGARTEN_STUDENT.insertMany(
                validStudents,
                { ordered: false }
            );
            insertedCount = insertedStudents.length;
            console.log(
                `Successfully inserted ${insertedCount} kindergarten students into MongoDB`
            );
        } else {
            console.log("No valid kindergarten student records to insert");
        }

        await fsPromises.unlink(filePath);

        return {
            success: true,
            message: `Inserted ${insertedCount} kindergarten students`,
            count: insertedCount,
            invalidRecords: invalidRecords.length > 0 ? invalidRecords : undefined,
        };
    } catch (error) {
        try {
            await fsPromises.unlink(filePath);
        } catch (unlinkError) {
            console.error("Error deleting file:", unlinkError);
        }
        console.error("Error processing kindergarten student CSV file:", error);
        throw new Error("Invalid data in CSV file", { cause: { invalidRecords } });
    }
}