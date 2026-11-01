import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";

/**
 * Session / calendar-year dropdown.
 * Loads years from API, defaults to current, exposes selected label via onChange.
 * Use value="ALL" for no year filter.
 */
export default function CalendarYearSelect({
  value,
  onChange,
  allowAll = true,
  className = "mt-1 w-full border rounded px-3 py-2",
  label = "Session / Calendar Year",
}) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allRes, currentRes] = await Promise.all([
          axios.get(`${BASE_URL}/calendar-years`).catch(() => ({ data: {} })),
          axios.get(`${BASE_URL}/calendar-year/current`).catch(() => ({ data: {} })),
        ]);
        if (cancelled) return;
        const list =
          allRes.data?.data ||
          allRes.data?.calendarYears ||
          allRes.data ||
          [];
        const yearsArr = Array.isArray(list) ? list : [];
        setYears(yearsArr);
        if (!value) {
          const current =
            currentRes.data?.data?.label ||
            currentRes.data?.label ||
            yearsArr.find((y) => y.isCurrent)?.label ||
            yearsArr[0]?.label ||
            "";
          if (current) onChange?.(current);
        }
      } catch (err) {
        console.error("Failed to load calendar years:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <select
        className={className}
        value={value || ""}
        disabled={loading}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {loading && <option value="">Loading…</option>}
        {!loading && !value && <option value="">Select session</option>}
        {allowAll && <option value="ALL">All years</option>}
        {years.map((y) => {
          const labelText = y.label || y.name || String(y);
          return (
            <option key={labelText} value={labelText}>
              {labelText}
              {y.isCurrent ? " (current)" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
