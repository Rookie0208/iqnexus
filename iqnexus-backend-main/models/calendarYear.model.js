import mongoose from "mongoose";

const CalendarYearSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      // e.g. "2025-2026"
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure only one calendar year can be current at a time
CalendarYearSchema.pre("save", async function (next) {
  if (this.isCurrent) {
    await mongoose.model("CalendarYear").updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

export const CalendarYear = mongoose.model("CalendarYear", CalendarYearSchema);
