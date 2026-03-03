import mongoose from "mongoose";

/**
 * Dynamic Subject Management Model
 * Allows admin to create, edit, or remove subjects dynamically
 */
const SubjectSchema = new mongoose.Schema({
  // Subject code (e.g., "IQMOL1", "IQCOL1" for a new coding olympiad)
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },

  // Display name (e.g., "Mathematics Olympiad Level 1")
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // Short label (e.g., "IQMO L1")
  label: {
    type: String,
    required: true,
    trim: true,
  },

  // Category / subject area (e.g., "Mathematics", "Science", "Computer", "AI", "Coding", "Reasoning")
  category: {
    type: String,
    required: true,
    trim: true,
  },

  // Exam level: Level-1 or Level-2
  examLevel: {
    type: String,
    enum: ["L1", "L2"],
    required: true,
  },

  // Internal field name in student model result (e.g., "IMOL1", "ITSTL1")
  // For new subjects, can be auto-generated
  resultFieldKey: {
    type: String,
    required: true,
    trim: true,
  },

  // Student registration field (e.g., "IMOL1" which stores "0" or "1")
  registrationField: {
    type: String,
    trim: true,
    default: "",
  },

  // Paper structure configuration
  paperStructure: {
    totalSections: { type: Number, default: 5, min: 1, max: 10 },
    sectionNames: [{ type: String }],
    totalQuestions: { type: Number, default: 50 },
    totalMarks: { type: Number, default: 100 },
    duration: { type: Number, default: 60 }, // in minutes
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0 },
  },

  // Qualification rules for this subject
  qualificationRules: {
    qualifyingPercentage: { type: Number, default: 40 },
    qualifiesForLevel2: { type: Boolean, default: true }, // L1 subjects qualify for L2
    minimumAttendance: { type: String, enum: ["PRESENT"], default: "PRESENT" },
  },

  // Tie-break criteria order (array of criteria in priority order)
  // Each criterion: "totalMarks", "achieversSection", "higherDifficulty", "level1Marks", "age"
  tieBreakOrder: {
    type: [String],
    default: ["totalMarks", "achieversSection", "higherDifficulty", "level1Marks", "age"],
  },

  // Which section is the "Achievers Section" (for tie-breaking)
  achieversSectionIndex: {
    type: Number,
    default: 5, // Section 5 by default
  },

  // Which section is "Higher Difficulty / Application Questions" (for tie-breaking)
  higherDifficultyIndex: {
    type: Number,
    default: 4, // Section 4 by default
  },

  // Linked Level-1 subject code (for Level-2 subjects, used in tie-breaking)
  linkedLevel1Subject: {
    type: String,
    default: "",
  },

  // Batch/Academic year
  batchId: {
    type: String,
    default: "2024-25",
  },

  // Whether this subject is currently active
  isActive: {
    type: Boolean,
    default: true,
  },

  // Sort order for display
  displayOrder: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

SubjectSchema.index({ code: 1, batchId: 1 }, { unique: true });

const modelName = "subjects";
export const Subject = mongoose.models[modelName] || mongoose.model(modelName, SubjectSchema, modelName);
