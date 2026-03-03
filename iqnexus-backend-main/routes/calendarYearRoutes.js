import express from "express";
import {
  getAllCalendarYears,
  getCurrentCalendarYear,
  createCalendarYear,
  setCurrentCalendarYear,
  updateCalendarYear,
  deleteCalendarYear,
} from "../controllers/calendarYearController.js";

const router = express.Router();

router.get("/calendar-years", getAllCalendarYears);
router.get("/calendar-year/current", getCurrentCalendarYear);
router.post("/calendar-year", createCalendarYear);
router.put("/calendar-year/:id/set-current", setCurrentCalendarYear);
router.put("/calendar-year/:id", updateCalendarYear);
router.delete("/calendar-year/:id", deleteCalendarYear);

export default router;
