import mongoose from "mongoose";

/**
 * Individual Prize Rule Schema
 * Each rule defines a prize type with its selection criteria
 */
const PrizeRuleSchema = new mongoose.Schema({
  // Order/priority - lower number = higher priority prize
  priority: {
    type: Number,
    required: true,
  },

  // Prize name (semicolon-separated components)
  // e.g. "INTERNATIONAL WINNER CUP;MEDAL OF EXCELLENCE(GOLD);CERTIFICATE"
  prizeType: {
    type: String,
    required: true,
  },

  // Whether this is a topper-category prize (rank-based selection)
  isTopperCategory: {
    type: Boolean,
    default: true,
  },

  // Category/scope of the prize
  // NATIONALITY, COUNTRY, CITY, SCHOOL, CLASS, SECTION, all
  category: {
    type: String,
    enum: ["NATIONALITY", "COUNTRY", "CITY", "SCHOOL", "CLASS", "SECTION", "all"],
    required: true,
  },

  // Whether to show this prize in reports
  show: {
    type: Boolean,
    default: true,
  },

  // Total number of this prize to distribute within the category scope.
  // Ranks are auto-calculated from results; this controls how many
  // top-ranked students receive this prize.
  // e.g. category=SECTION & totalPrizes=5 → top 5 per section get this prize.
  // 0 = no limit (all qualifying students get it).
  totalPrizes: {
    type: Number,
    default: 0,
  },

  // If true, students who already won a higher-priority prize are excluded
  excludeHigherPrizeWinners: {
    type: Boolean,
    default: true,
  },
}, { _id: true });


/**
 * Prize Configuration Model
 * Stores prize rules for a specific exam + class combination
 */
const PrizeConfigSchema = new mongoose.Schema({
  // Exam code (e.g., "IQGKOL1", "IQMOL1")
  exam: {
    type: String,
    required: true,
  },

  // Class level (e.g., "1", "2", ... "12", "KG", "all")
  classLevel: {
    type: String,
    required: true,
  },

  // Batch/Academic year
  batchId: {
    type: String,
    default: "2024-25",
  },

  // Prize level: "basic" or "advance"
  level: {
    type: String,
    enum: ["basic", "advance"],
    default: "basic",
  },

  // Array of prize rules ordered by priority
  prizeRules: [PrizeRuleSchema],

  // Global setting: if true, a student winning a higher prize
  // is automatically excluded from lower prizes
  excludeHigherWinners: {
    type: Boolean,
    default: true,
  },

  // Whether this config is active
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Compound unique index: one config per exam + class + batch + level
PrizeConfigSchema.index(
  { exam: 1, classLevel: 1, batchId: 1, level: 1 },
  { unique: true }
);

const modelName = "prize-configs";
export const PrizeConfig =
  mongoose.models[modelName] ||
  mongoose.model(modelName, PrizeConfigSchema, modelName);
