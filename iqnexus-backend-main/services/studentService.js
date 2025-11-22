import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();


export async function fetchDataByMobile(mobNo) {
  try {
    // Convert mobNo to string and validate
    const mobileNumber = String(mobNo).trim();
    if (!mobileNumber) {
      console.warn("⚠ Invalid mobile number: empty or invalid");
      return { error: "Invalid mobile number: must be a non-empty string" };
    }

    // Query the student_data_latests collection using Mongoose
    const data = await STUDENT_LATEST.find({ mobNo: mobileNumber });

    if (!data) {
      console.warn("⚠ No student found for Mobile No:", mobileNumber);
      return { error: "No student found with this mobile number" };
    }
    console.log("Data fetched from MongoDB:", data);
    // Fetch school data using the schoolCode (assumed to be a Number)
    
    const schoolData= await  Promise.all(data.map(async (item) => {
          return await fetchSchoolData(item.schoolCode);
    })
  )

    console.log("School data fetched from MongoDB:", schoolData);
    // Prepare the response data
    
    const extractedData = data.map((data ,index) => {
      return (
        {
      "Roll No": data.rollNo || "Unknown",
      Duplicates: data.Duplicates !== undefined ? data.Duplicates : false,
      "School Code": data.schoolCode || "",
      Class: data.class !== undefined ? data.class : "Unknown",
      Section: data.section || "Unknown",
      "Student's Name": data.studentName?.trim() || "Unknown",
      "Mother's Name": data.motherName || "",
      "Father's Name": data.fatherName || "",
      DOB: data.dob || "",
      "Mob No": data.mobNo || "",
      "IAOL Basic": data.IAOL1 !== undefined ? data.IAOL1 : "0",
      "IAOL Basic Book": data.IAOL1Book !== undefined ? data.IAOL1Book : "0",
      "ITSTL Basic": data.ITSTL1 !== undefined ? data.ITSTL1 : "0",
      "ITSTL Basic Book": data.ITSTL1Book !== undefined ? data.ITSTL1Book : "0",
      "IMOL Basic": data.IMOL1 !== undefined ? data.IMOL1 : "0",
      "IMOL Basic Book": data.IMOL1Book !== undefined ? data.IMOL1Book : "0",
      "IGKOL Basic": data.IGKOL1 !== undefined ? data.IGKOL1 : "0",
      "IGKOL Basic Book": data.IGKOL1Book !== undefined ? data.IGKOL1Book : "0",
      "IENGOL Basic": data.IENGOL1 !== undefined ? data.IENGOL1 : "0",
      "IENGOL Basic Book": data.IENGOL1Book !== undefined ? data.IENGOL1Book : "0",
      "Total Basic Level Participated Exams":
        data.totalBasicLevelParticipatedExams !== undefined
          ? data.totalBasicLevelParticipatedExams
          : "0",
      "Basic Level Full Amount":
        data.basicLevelFullAmount !== undefined ? data.basicLevelFullAmount : "0",
      "Basic Level Paid Amount":
        data.basicLevelAmountPaid !== undefined ? data.basicLevelAmountPaid : "0",
      "Basic Level Amount Paid Online":
        data.basicLevelAmountPaidOnline !== undefined
          ? data.basicLevelAmountPaidOnline
          : "",
      "Is Basic Level Concession Given": data.isBasicLevelConcessionGiven || "",
      "Concession Reason": data.concessionReason || "",
      Remark: data.remark || "",
      "Parents Working School": data.ParentsWorkingschool || "",
      Designation: data.designation || "",
      City: data.city || "",
      "IAOL Advance": data.IAOL2 !== undefined ? data.IAOL2 : "0",
      "ITSTL Advance": data.ITSTL2 !== undefined ? data.ITSTL2 : "0",
      "IMOL Advance": data.IMOL2 !== undefined ? data.IMOL2 : "0",
      "IENGOL Advance": data.IENGOL2 !== undefined ? data.IENGOL2 : "0",
      "Advance Level Paid Amount": data.advanceLevelAmountPaid || "",
      "Advance Level Amount Paid Online": data.advanceLevelAmountPaidOnline || "",
      "Total Amount Paid": data.totalAmountPaid || "",
      "Total Amount Paid Online": data.totalAmountPaidOnline || "",
      // School data fields
      "School City": schoolData[index]?.city?.trim() || "Unknown",
      Country: schoolData[index]?.country?.trim() || "Unknown",
      School: schoolData[index]?.schoolName?.trim() || "Unknown",
      Area: schoolData[index]?.area?.trim() || "Unknown",
      Incharge: schoolData[index]?.incharge?.trim() || "Unkown",
      Principal: schoolData[index]?.principalName?.trim() || "Unkown",
        }
      )
    }
    )

    return extractedData;
  } catch (error) {
    console.error("❌ Error fetching data from MongoDB:", error);
    return { error: "Failed to fetch data", details: error.message };
  }
}


export async function fetchKgDataByMobile(mobNo) {
  try {
    // Convert mobNo to string and validate
    const mobileNumber = String(mobNo).trim();
    if (!mobileNumber) {
      console.warn("⚠ Invalid mobile number: empty or invalid");
      return { error: "Invalid mobile number: must be a non-empty string" };
    }

    // Query the kindergarten_student_datas collection using Mongoose
    const data = await KINDERGARTEN_STUDENT.find({ mobNo: mobileNumber });

    if (!data || data.length === 0) {
      console.warn("⚠ No KG student found for Mobile No:", mobileNumber);
      return null;
    }

    // Fetch school data using the schoolCode (assumed to be a Number)
    
    const schoolData= await  Promise.all(data.map(async (item) => {
          return await fetchSchoolData(item.schoolCode);
    }))

    // Prepare the response data
    
       const extractedData = data.map((data ,index) => {
      return (
        {
      "Roll No": data.rollNo || "Unknown",
      Duplicates: data.Duplicates !== undefined ? data.Duplicates : false,
      "School Code": data.schoolCode || "",
      Class: data.class !== undefined ? data.class : "Unknown",
      Section: data.section || "Unknown",
      "Student's Name": data.studentName?.trim() || "Unknown",
      "Mother's Name": data.motherName || "",
      "Father's Name": data.fatherName || "",
      DOB: data.dob || "",
      "Mob No": data.mobNo || "",
      "IQKG": data.IQKG !== undefined ? data.IQKG : "0",
      // KD Exam fields formatted to match Dashboard pattern
      "IQKDL Basic": data.IQKD1 !== undefined ? data.IQKD1 : "0",
      "IQKDL Advance": data.IQKD2 !== undefined ? data.IQKD2 : "0",
      "IQKDL Basic Book": data.iqkdBook !== undefined ? data.iqkdBook : "0",
      "Total Basic Level Participated Exams":
        data.totalBasicLevelParticipatedExams !== undefined
          ? data.totalBasicLevelParticipatedExams
          : "0",
      "Basic Level Full Amount":
        data.basicLevelFullAmount !== undefined ? data.basicLevelFullAmount : "0",
      "Basic Level Paid Amount":
        data.basicLevelAmountPaid !== undefined ? data.basicLevelAmountPaid : "0",
      "Basic Level Amount Paid Online":
        data.basicLevelAmountPaidOnline !== undefined
          ? data.basicLevelAmountPaidOnline
          : "",
      "Advance Level Paid Amount": data.advanceLevelAmountPaid || "",
      "Advance Level Amount Paid Online": data.advanceLevelAmountPaidOnline || "",
      "Total Amount Paid": data.totalAmountPaid || "",
      "Total Amount Paid Online": data.totalAmountPaidOnline || "",
      // School data fields
      "School City": schoolData[index]?.city?.trim() || "Unknown",
      Country: schoolData[index]?.country?.trim() || "Unknown",
      School: schoolData[index]?.schoolName?.trim() || "Unknown",
      Area: schoolData[index]?.area?.trim() || "Unknown",
      Incharge: schoolData[index]?.incharge?.trim() || "Unkown",
      Principal: schoolData[index]?.principalName?.trim() || "Unkown",
    })})

    return extractedData;
  } catch (error) {
    console.error("❌ Error fetching data from MongoDB:", error);
    return { error: "Failed to fetch data", details: error.message };
  }
}


async function fetchSchoolData(code) {
  try {

    // Convert code to string for cleaning
    let schoolCodeString = String(code).trim();

    // Clean the string (remove commas, quotes, etc.)
    schoolCodeString = schoolCodeString.replace(/,/g, "").replace(/"/g, "");

    // Validate the school code
    if (!schoolCodeString) {
      console.error("Invalid school code: empty or invalid string");
      return { error: "Invalid school code: must be a non-empty string" };
    }

    // Convert to number for query (since schoolCode is Number in schema)
    const schoolCodeNumber = parseInt(schoolCodeString, 10);
    if (isNaN(schoolCodeNumber)) {
      console.error("Invalid school code: cannot convert to number:", schoolCodeString);
      return { error: "Invalid school code: must be a valid number" };
    }

    // Query the School collection using the school code as a number
    const schoolData = await School.findOne({ schoolCode: schoolCodeNumber });

    if (!schoolData) {
      console.error(
        "No school found for School Code:",
        schoolCodeNumber,
        ", in collection: schools-datas (using Mongoose)"
      );
      return { error: "No school found with this code" };
    }

    return schoolData.toObject();
  } catch (error) {
    console.error("Error fetching school data:", error);
    return { error: "Failed to fetch school data", details: error.message };
  }
}


export async function fetchSchoolNames(examLevel) {
  if (!examLevel) {
    throw new Error("examLevel is required");
  }

  const query = {};

  if (examLevel === "L1") {
    query.$or = [
      { IAOL1: "1" },
      { ITSTL1: "1" },
      { IMOL1: "1" },
      { IGKOL1: "1" },
      { IENGOL1: "1" },
    ];
  } else if (examLevel === "L2") {
    query.$or = [
      { IAOL2: "1" },
      { ITSTL2: "1" },
      { IMOL2: "1" },
      { IENGOL2: "1" },
    ];
  } else {
    throw new Error("Invalid exam level");
  }

  // Step 1: Get student records matching exam level
  const students = await STUDENT_LATEST.find(query).select("schoolCode");

  // Step 2: Extract unique school codes
  const uniqueSchoolCodes = [
    ...new Set(students.map((s) => s.schoolCode).filter(Boolean)),
  ];

  if (uniqueSchoolCodes.length === 0) {
    return {
      schoolNames: [],
      totalSchools: 0,
    };
  }

  // Step 3: Get school names from School model
  const schoolNames = await School.find({
    schoolCode: { $in: uniqueSchoolCodes },
  }).select("schoolCode schoolName");

  return {
    schoolNames,
    totalSchools: schoolNames.length,
  };
}
