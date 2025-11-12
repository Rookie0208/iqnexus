import fs from "fs";
import { parse } from "csv-parse";
import { School } from "../models/schoolModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

export async function convertXlsxToMongoDbForSchool(filePath) {
  try {
    const schools = [];
    const invalidRecords = [];
    const parser = fs
      .createReadStream(filePath)
      .pipe(
        parse({
          columns: [
            "School Code",
            "School Name",
            "Email Id",
            "FAX",
            "Area",
            "City",
            "Country",
            "Incharge",
            "Incharge DOB",
            "Incharge Mob",
            "Principal Name",
            "Principal DOB",
            "Principal Mob",
            "Remark",
          ],
          skip_lines: 1, 
          trim: true,
        })
      );

    for await (const record of parser) {
      schools.push(record);
    }

    const processedSchools = schools.map((school, index) => {
      let schoolCode = null;
      if (school["School Code"]) {
        const parsedCode = parseInt(school["School Code"]);
        if (!isNaN(parsedCode)) {
          schoolCode = parsedCode;
        } else {
          invalidRecords.push({
            row: index + 2, 
            schoolCode: school["School Code"],
            message: `Invalid schoolCode value: "${school["School Code"]}"`,
          });
        }
      }

      return {
        schoolCode,
        schoolName: school["School Name"] || "",
        schoolEmail: school["Email Id"] || "",
        fax: school["FAX"] || "",
        area: school["Area"] || "",
        city: school["City"] || "",
        country: school["Country"] || "",
        incharge: school["Incharge"] || "",
        inchargeDob: school["Incharge DOB"] || "",
        schoolMobNo: school["Incharge Mob"] || "",
        principalName: school["Principal Name"] || "",
        principalDob: school["Principal DOB"] || "",
        principalMobNo: school["Principal Mob"] || "",
        remark: school["Remark"] || "",
      };
    });

    if (invalidRecords.length > 0) {
      console.warn("Invalid records found:", invalidRecords);
    }

    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB is not connected");
    }

    await School.insertMany(processedSchools);
    console.log(
      `Successfully inserted ${processedSchools.length} schools into MongoDB`
    );

    return {
      success: true,
      message: `Inserted ${processedSchools.length} schools`,
      invalidRecords: invalidRecords.length > 0 ? invalidRecords : undefined,
    };
  } catch (error) {
    console.error("Error processing CSV file:", error);
    throw error;
  }
}