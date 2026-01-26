import mongoose from "mongoose";
const Schema = mongoose.Schema;

const StudentSchema = new Schema(
  {
    rollNo: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    Duplicates: {
      type: Boolean,
      default: false,
    },
    schoolCode: {
      type: Number,
      required: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      // Section-wise result schema for each exam
      IAOL1: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      IAOL2: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      ITSTL1: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      ITSTL2: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      IMOL1: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      IMOL2: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      IGKOL1: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      IENGOL1: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
      IENGOL2: {
        attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'], default: 'ABSENT' },
        section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
        passOrFail: String,
      },
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
      default: "",
    },
    fatherName: {
      type: String,
      trim: true,
      default: "",
    },
    dob: {
      type: String,
      trim: true,
      default: "",
    },
    mobNo: {
      type: String,
      trim: true,
      default: "",
    },
    IAOL1: {
      type: String,
      trim: true,
      default: "0",
    },
    IAOL1Book: {
      type: String,
      trim: true,
      default: "0",
    },
    ITSTL1: {
      type: String,
      trim: true,
      default: "0",
    },
    ITSTL1Book: {
      type: String,
      trim: true,
      default: "0",
    },
    IMOL1: {
      type: String,
      trim: true,
      default: "0",
    },
    IMOL1Book: {
      type: String,
      trim: true,
      default: "0",
    },
    IGKOL1: {
      type: String,
      trim: true,
      default: "0",
    },
    IGKOL1Book: {
      type: String,
      trim: true,
      default: "0",
    },
    IENGOL1: {
      type: String,
      trim: true,
      default: "0",
    },
    IENGOL1Book: {
      type: String,
      trim: true,
      default: "0",
    },
    totalBasicLevelParticipatedExams: {
      type: String,
      trim: true,
      default: "0",
    },
    basicLevelFullAmount: {
      type: String,
      trim: true,
      default: "0",
    },
    basicLevelAmountPaid: {
      type: String,
      trim: true,
      default: "0",
    },
    basicLevelAmountPaidOnline: {
      type: String,
      trim: true,
      default: "",
    },
    isBasicLevelConcessionGiven: {
      type: String,
      trim: true,
      default: "",
    },
    concessionReason: {
      type: String,
      trim: true,
      default: "",
    },
    remark: {
      type: String,
      trim: true,
      default: "",
    },
    ParentsWorkingschool: {
      type: String,
      trim: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    IAOL2: {
      type: String,
      trim: true,
      default: "0",
    },
    ITSTL2: {
      type: String,
      trim: true,
      default: "0",
    },
    IMOL2: {
      type: String,
      trim: true,
      default: "0",
    },
    IENGOL2: {
      type: String,
      trim: true,
      default: "0",
    },
    advanceLevelAmountPaid: {
      type: String,
      trim: true,
      default: "",
    },
    advanceLevelAmountPaidOnline: {
      type: String,
      trim: true,
      default: "",
    },
    totalAmountPaid: {
      type: String,
      trim: true,
      default: "",
    },
    totalAmountPaidOnline: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Register the model
export const STUDENT_LATEST = mongoose.model(
  "student_data_latests",
  StudentSchema
);

export const getStudentsByFilters = async (
  schoolCode,
  className,
  rollNo,
  section,
  studentName,
  subject,
  examLevel,
  page = 1,
  limit = 10
) => {
  const matchConditions = [];

  // Roll No (exact match)
  if (rollNo && rollNo.trim() !== "") {
    matchConditions.push({
      rollNo: rollNo.trim(),
    });
  }

  // Student Name (case-insensitive partial match)
  if (studentName && studentName.trim() !== "") {
    matchConditions.push({
      studentName: { $regex: studentName.trim(), $options: "i" },
    });
  }

  // School Code
  if (schoolCode) {
    matchConditions.push({
      schoolCode: { $in: [Number(schoolCode), String(schoolCode)] },
    });
  }

  // Class Name (Array support)
  if (className && Array.isArray(className) && className.length > 0) {
    const classVariants = className.flatMap((cls) => {
      const trimmed = cls.trim();
      return [trimmed, Number(trimmed)];
    });

    matchConditions.push({
      class: { $in: classVariants },
    });
  }

  // Section (Array support)
  if (section && Array.isArray(section) && section.length > 0) {
    matchConditions.push({
      section: { $in: section.map((s) => s.trim()) },
    });
  }

  // Subject filter
  if (subject && subject.trim() !== "") {
    const field1 = `${subject}L1`;
    const field2 = `${subject}L2`;
    matchConditions.push({
      $or: [{ [field1]: { $in: [1, "1"] } }, { [field2]: { $in: [1, "1"] } }],
    });
  }
  //exam Level filter
  if(examLevel){
     if (examLevel === "L1") {

matchConditions.push({
$or :[
      { IAOL1: "1" },
      { ITSTL1: "1" },
      { IMOL1: "1" },
      { IGKOL1: "1" },
      { IENGOL1: "1" },
    ]
  })
  
  } else {

    matchConditions.push({
$or : [
      { IAOL2: "1" },
      { ITSTL2: "1" },
      { IMOL2: "1" },
      { IENGOL2: "1" },
    ]

  })
  
  }
}

  // Aggregation pipeline
  const pipeline = [];

  // Match stage
  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  // Count total documents for pagination
  const countPipeline = [...pipeline, { $count: "totalStudents" }];
  const countResult = await STUDENT_LATEST.aggregate(countPipeline);
  const totalStudents =
    countResult.length > 0 ? countResult[0].totalStudents : 0;

  // Add sorting, pagination stages
  pipeline.push(
    { $sort: { studentName: 1 } }, // Optional: sort by studentName
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );

  // Execute the main query
  const data = await STUDENT_LATEST.aggregate(pipeline);

  return {
    data,
    totalStudents,
    totalPages: Math.ceil(totalStudents / limit),
  };
};
