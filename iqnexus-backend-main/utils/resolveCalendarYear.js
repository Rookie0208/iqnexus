import { CalendarYear } from "../models/calendarYear.model.js";

/**
 * Resolve which calendarYear label to filter on.
 * - explicit "ALL" / "all" / "" → null (no year filter)
 * - explicit label → that label
 * - omitted → current CalendarYear.label (or null if none set)
 */
export async function resolveCalendarYear(explicit) {
  if (explicit === undefined || explicit === null) {
    const current = await CalendarYear.findOne({ isCurrent: true }).lean();
    return current?.label || null;
  }
  const raw = String(explicit).trim();
  if (!raw || raw.toUpperCase() === "ALL") return null;
  return raw;
}

/** Mutates and returns query with calendarYear when label is set */
export function applyCalendarYearFilter(query, label) {
  if (label) {
    query.calendarYear = label;
  }
  return query;
}
