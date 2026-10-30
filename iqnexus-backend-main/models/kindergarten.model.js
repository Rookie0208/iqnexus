import mongoose from "mongoose";
const Schema = mongoose.Schema;

const KindergartenStudentSchema = new Schema(
    {
        rollNo: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        schoolCode: {
            type: Number,
            required: true,
        },
        // Class = NURSERY | LKG | UKG (PG / Play Group maps to NURSERY)
        // Legacy "KD" allowed only so pre-migration documents still load
        class: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            enum: ["NURSERY", "LKG", "UKG", "KD"],
        },
        // Section = A, B, C, … (school section — not PG/LKG/UKG)
        section: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            default: "A",
        },
        studentName: {
            type: String,
            required: true,
            trim: true,
        },
        fatherName: {
            type: String,
            trim: true,
            default: "",
        },
        motherName: {
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
        iqkdBook: {
            type: String,
            trim: true,
            default: "",
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
        IQKG: {
            type: String,
            trim: true,
            default: "0",
        },
        Duplicates: {
            type: Boolean,
            default: false,
        },
        // KG Exam participation fields
        IQKD1: {
            type: String,
            trim: true,
            default: "0",
        },
        IQKD2: {
            type: String,
            trim: true,
            default: "0",
        },
        calendarYear: {
            type: String,
            trim: true,
            default: "",
        },
        // Section-wise result schema for KG exams
        result: {
            IQKD1: {
                attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'] },
                section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                passOrFail: String,
            },
            IQKD2: {
                attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'] },
                section1: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section2: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section3: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section4: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                section5: { score: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                total: { score: Number, rank: Number, percentage: Number, correctCount: Number, totalCount: Number, unAttempted: Number },
                passOrFail: String,
            },
        },
    },
    { timestamps: true }
);

// Register the model
export const KINDERGARTEN_STUDENT = mongoose.model(
    "kindergarten_student_data",
    KindergartenStudentSchema
);