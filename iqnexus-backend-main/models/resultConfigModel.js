import mongoose from "mongoose";

/**
 * Result Configuration Model
 * Stores settings for result display and publication
 */
const ResultConfigSchema = new mongoose.Schema({
  // Subject/Exam identifier (e.g., "IQMOL1", "IQEOL1")
  subject: {
    type: String,
    required: true,
  },
  
  // Class level (1-12 or "KG")
  classLevel: {
    type: String,
    required: true,
  },
  
  // Batch/Academic year
  batchId: {
    type: String,
    default: "2024-25",
  },
  
  // Topic names for each section (Section 1-5)
  topicNames: {
    section1: { type: String, default: "Section 1" },
    section2: { type: String, default: "Section 2" },
    section3: { type: String, default: "Section 3" },
    section4: { type: String, default: "Section 4" },
    section5: { type: String, default: "Section 5" },
  },
  
  // Rank visibility settings
  rankVisibility: {
    schoolRank: { type: Boolean, default: true },
    zonalRank: { type: Boolean, default: true },
    nationalRank: { type: Boolean, default: true },
    internationalRank: { type: Boolean, default: true },
    classRank: { type: Boolean, default: true },
    sectionRank: { type: Boolean, default: true },
  },
  
  // Display settings
  displaySettings: {
    showPercentileScore: { type: Boolean, default: true },
    showQualificationStatus: { type: Boolean, default: true },
    showTopicPerformance: { type: Boolean, default: true },
    showAIChart: { type: Boolean, default: true },
  },
  
  // Publication status
  isPublished: {
    type: Boolean,
    default: false,
  },
  
  publishedAt: {
    type: Date,
    default: null,
  },
  
  publishedBy: {
    type: String,
    default: null,
  },
  
  // Rating scale configuration
  ratingScale: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      excellent: { min: 80, max: 100, color: "#22c55e", label: "EXCELLENT" },
      good: { min: 70, max: 79, color: "#3b82f6", label: "GOOD" },
      average: { min: 60, max: 69, color: "#eab308", label: "AVERAGE" },
      improve: { min: 45, max: 59, color: "#f97316", label: "IMPROVE" },
      bad: { min: 0, max: 44, color: "#ef4444", label: "BAD" },
    }
  },
  
}, { timestamps: true });

// Compound unique index
ResultConfigSchema.index({ subject: 1, classLevel: 1, batchId: 1 }, { unique: true });

const modelName = "result-configs";
export const ResultConfig = mongoose.models[modelName] || mongoose.model(modelName, ResultConfigSchema, modelName);
