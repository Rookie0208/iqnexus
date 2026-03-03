import { CalendarYear } from "../models/calendarYear.model.js";

// Get all calendar years
export const getAllCalendarYears = async (req, res) => {
  try {
    const years = await CalendarYear.find().sort({ startDate: -1 });
    return res.status(200).json({ success: true, data: years });
  } catch (error) {
    console.error("Error fetching calendar years:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get the current (active) calendar year
export const getCurrentCalendarYear = async (req, res) => {
  try {
    let current = await CalendarYear.findOne({ isCurrent: true });
    if (!current) {
      // Fallback: create a default calendar year
      current = await CalendarYear.create({
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-30"),
        label: "2025-2026",
        isCurrent: true,
      });
    }
    return res.status(200).json({ success: true, data: current });
  } catch (error) {
    console.error("Error fetching current calendar year:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new calendar year (admin sets dates manually)
export const createCalendarYear = async (req, res) => {
  try {
    const { startDate, endDate, label: providedLabel, isCurrent } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    // Auto-generate label from dates if not provided
    const label = providedLabel || `${start.getFullYear()}-${end.getFullYear()}`;

    // Check for overlapping years
    const existing = await CalendarYear.findOne({ label });
    if (existing) {
      return res.status(400).json({ message: `Calendar year "${label}" already exists` });
    }

    const calendarYear = new CalendarYear({
      startDate: start,
      endDate: end,
      label,
      isCurrent: isCurrent || false,
    });

    await calendarYear.save();

    return res.status(201).json({
      success: true,
      message: "Calendar year created successfully",
      data: calendarYear,
    });
  } catch (error) {
    console.error("Error creating calendar year:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Set a calendar year as the current one
export const setCurrentCalendarYear = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the target exists before modifying anything
    const target = await CalendarYear.findById(id);
    if (!target) {
      return res.status(404).json({ message: "Calendar year not found" });
    }

    // Unset all current flags
    await CalendarYear.updateMany({}, { $set: { isCurrent: false } });

    // Set the selected one as current
    const updated = await CalendarYear.findByIdAndUpdate(
      id,
      { $set: { isCurrent: true } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Calendar year "${updated.label}" set as current`,
      data: updated,
    });
  } catch (error) {
    console.error("Error setting current calendar year:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a calendar year
export const updateCalendarYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, label } = req.body;

    const updateData = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (label) updateData.label = label;

    const updated = await CalendarYear.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Calendar year not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Calendar year updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating calendar year:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a calendar year
export const deleteCalendarYear = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await CalendarYear.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Calendar year not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Calendar year deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting calendar year:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
