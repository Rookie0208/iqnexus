
---

## 1. Subject Management (New Feature)
- Added **Subject** model (`subjectModel.js`) with fields for code, name, label, category, exam level, result field key, paper structure (sections, marks, duration, negative marking), qualification rules, tie-break order, and achiever/difficulty section indexes.
- Created full CRUD controller (`subjectController.js`) with auto-seeding of 12 default subjects (IQMO, IQRO, IQSO, IQEO, IQGKO, IQKD at L1/L2), plus endpoints for tie-break order, qualification rules, field-map lookup, and soft/permanent delete.
- Created routes (`subjectRoutes.js`) — 10 endpoints.
- Built admin UI page (`SubjectManagement.jsx`) for creating, editing, deleting subjects with paper structure config, tie-break ordering, qualification rules, and search/filter by level.
- `ExamManagement.jsx` and `ViewResults.jsx` now dynamically fetch exam options from `GET /subjects` with hardcoded fallback.

---

## 2. Ranking & Results Workflow (New Feature)
- Created **Ranking** controller (`rankingController.js`, ~865 lines) — the core ranking engine. Dynamically resolves exam fields from the Subject collection. Handles:
  - Qualification settings (get/update qualifying percentage, recalculate qualification).
  - Rank calculation across school/class/section/zonal/national/international scopes.
  - Admin overrides: edit marks, set manual rank, joint rank.
  - Result workflow: lock/unlock/publish results.
- Created routes (`rankingRoutes.js`) — 13 endpoints covering qualification, ranking, overrides, and workflow.
- Extended **ResultConfig** model (`resultConfigModel.js`) with new fields for ranking and workflow state.
- Built admin UI page (`RankingManagement.jsx`) — multi-tab interface with Qualification, Calculate Ranks, Admin Override, and Result Workflow tabs.

---

## 3. Calendar Year Management (New Feature)
- Added **CalendarYear** model (`calendarYear.model.js`) with `startDate`, `endDate`, `label`, and `isCurrent` fields; pre-save hook ensures only one year is active at a time.
- Created full CRUD controller (`calendarYearController.js`) with auto-generated labels, overlap validation, and a set-current endpoint — 6 endpoints total.
- Created routes (`calendarYearRoutes.js`).
- Built admin UI page (`CalendarYearManagement.jsx`) for creating, editing, deleting, and switching the active calendar year.
- Added **Sidebar** nav item ("Calendar Year") with `CalendarDays` icon.
- Auto-assign current calendar year to students on add/upload (both regular and kindergarten).
- Added `calendarYear` field to both **Student** and **Kindergarten** models.

---

## 4. Prize Configuration (New Feature)
- Added **PrizeConfig** model (`prizeConfigModel.js`) with a flexible priority-based rule schema supporting categories like nationality, city, school, class, and section toppers with configurable percentage/rank criteria and `excludeHigherPrizeWinners` flag.
- Created controller (`prizeConfigController.js`) with default prize rule templates (International/National/Zonal/School trophies, medals, certificates) and CRUD + clone operations — 5 endpoints.
- Created routes (`prizeConfigRoutes.js`).
- Built admin UI page (`PrizeConfiguration.jsx`) for managing prize rule sets per exam with filter by exam/class/level, add/edit/reorder rules, and clone configs.

---

## 5. Prize Tagging (New Feature)
- Created **Prize Tag** controller (`prizeTagController.js`) that queries students by school + exam, matches against prize config rules, and groups winners by prize type for tag/certificate generation.
- Routes registered (`prizeTagRoutes.js`) — `GET /prize-tag`.
- Built admin UI page (`PrizeTag.jsx`) with school/exam/class/level filters, expandable prize rows, PDF download via jsPDF, and print-ready certificate-style layout.
- Added **Sidebar** "Prize" dropdown menu with "Prize Config", "Prize Tag", and "Prize Override" sub-items.

---

## 6. Prize Override (New Feature)
- Created **Prize Override** controller (`prizeOverrideController.js`) for manual prize management at the individual student level. Writes directly to a student's `result.<exam>.prize` field with audit trail (`prizeOverride` object with admin, timestamp, reason).
- 5 operations: assign prize, remove prize, change winner (transfer between students), grant special awards, and edit allocation.
- Built admin UI page (`PrizeOverride.jsx`) with four sections: Assign, Remove, Change Winner, and Special Award — all by roll number with subject & batch selectors.

---

## 7. Kindergarten (KG) Exam Support
- Added **IQKD1** and **IQKD2** exam types across the system (exam codes, field mapping, exam management options).
- Extended `kindergarten.model.js` with a `result` schema containing section-wise scoring (section1–section5 + total) for both IQKD1 and IQKD2.
- **Result upload** (`resultController.js`): routes KG exams to the `KINDERGARTEN_STUDENT` model; skips admit card validation for KG students.
- **Result viewing** (`resultConfigController.js`): `getSingleStudentResult` and rank calculation now dynamically select the correct model (KG vs regular).
- **Result listing** (`getAllResults`): filters, pagination, and ranking all work for KG exams.
- **Result export** (`exportResultsToExcel`): includes KG students; replaced rank columns with simpler `TOTAL MARKS`, `PERCENTAGE`, `PASS/FAIL`.
- `ExamManagement.jsx`: added IQKD1/IQKD2 exam options and "Kindergarten (KD)" class level.
- `AnswerKeyUpload.jsx`: added KG exam codes (`IQKDL1`/`IQKDL2`), KG-specific class options (LKG, UKG, PG), and 2-option answer keys (A/B) for KG exams.
- `uploadResults.jsx`: added KG exam level, KG-aware validation (calls `/kindergarten-students`), auto-sets class to "KD", updated template format text.
- `ViewResults.jsx`: added `KD` to class options, `LKG`/`UKG`/`PG` to section options, and IQKD1/IQKD2 subject entries.

---

## 8. Admit Card Improvements
- **"All Schools" batch generation**: AdmitCard page now supports selecting "All Schools" and batch-generating admit cards for every school in a loop, tracking success/failure counts.
- **Searchable school dropdown**: replaced plain `<select>` with `react-select` `<Select>` component — searchable, clearable, styled options showing `schoolCode - schoolName`.
- **Backend refactored** (`admitCardController.js`): extracted inline student-ID extraction and lookup into helper functions (`extractStudentId`, `findStudentById`, `formatStudent`); `getAdmitCardStudents` accepts `allSchools` flag.
- **Admit card service refactored** (`admitCardService.js`):
  - Single DB connection opened per batch instead of per-student (performance).
  - Added `sanitizeFilename()` to handle special characters in student names (strips illegal chars, caps length at 80).
  - Per-student `try/catch` so one failure doesn't abort the entire batch.
  - Kindergarten-aware: `isKindergarten` param — KG students get a single consolidated "IQKD" exam row.
  - Null-safe: student/school fields use `|| "N/A"` / `|| "Unknown School"` fallbacks.
  - Upload logic: checks GridFS before reporting missing file; `fs.unlinkSync` wrapped in try/catch.
  - Removed code that wiped the entire `./outputs` directory on each generation.
- **PDF template redesigned**: professional single-page A4 layout with double border, navy/accent color scheme, structured student-info table with alternating rows, exam enrollment status badges (green "ENROLLED" / gray "NOT ENROLLED"), passport-photo placeholder, signature section, and footer.
- Updated generate-disabled logic: enabled when exam level + school + exam date are set.

---

## 9. Dashboard Enhancements (Home Page)
- Added **KG student count** card with `Baby` icon (links to `/allKindergartenStudents`).
- Added **class-wise student counts**, **KG section counts**, **recent updates** (last 10 students with name, class, roll, school, date), and **city-wise school distribution** (top 10) to the dashboard API.
- Fixed `useEffect` missing dependency array `[]` (was re-fetching on every render).
- Quick Stats widget now shows real data instead of placeholder text.

---

## 10. All Schools Page — Search, Filter, Sort & Export
- Added **search** by school name or code, **city filter** dropdown (populated from API), and **sort by school code** (asc/desc toggle with ▲/▼ indicators).
- Backend `getAllSchools` now accepts `search`, `city`, `sortBy`, `sortOrder` query params and returns distinct city list + total count.
- New endpoint **`/all-schools-no-pagination`** (`getAllSchoolsNoPagination`) for full data export.
- Added **"Download XLS"** button that exports all filtered schools to an Excel file using `xlsx`.

---

## 11. Result Upload Validation & Bug Fixes
- **File format validation** (`uploadResult`): checks for required columns (`ROLL NO`, `ATTENDANCE`, `S1_Score`, `Total_Score`) — returns 400 with descriptive error if invalid.
- **Pre-upload validation chain**: school existence check → student count check for school+class → admit card generation check (GridFS `admitCards.files`) — all with descriptive error messages.
- **`uploadResultSimple`**: same validation suite; only increments `successCount` when `findOneAndUpdate` actually matches a document.
- **`getAllResults` query fix**: changed filter from `attendance: { $exists: true }` to `total.score: { $exists: true }` — the old filter showed all students because attendance defaulted to `'ABSENT'` for everyone.
- **`getAllResults` config fallback**: relaxed from hard 403 block to soft fallback — tries `classLevel: "all"` first, then class-specific; returns `noAdmitCards` warning flag when no admit cards exist.
- **`getSingleStudentResult`**: fixed `totalMarks` default from 50 to 0; added `totalMaxScore` back-calculated from percentage.
- **`getPublishedResult`**: added fallback to find any published config if universal config doesn't exist.
- **`getResultConfig`**: added fallback query when exact `classLevel` match not found.

---

## 12. Student Model & Upload Fixes
- **Removed `default: 'ABSENT'`** from the `attendance` field across all 9 exam result sub-schemas (IAOL1, IAOL2, ITSTL1, ITSTL2, IMOL1, IMOL2, IGKOL1, IENGOL1, IENGOL2) — was causing every student to appear as having results.
- **XLSX/XLS file support**: new `parseXlsxFile()` function (using `xlsx` library); existing CSV parser refactored into `parseCsvFile()` with header validation (required columns: `Roll No.`, `School Code`, `Student Name`, `Class`).
- **Upsert strategy**: changed from `insertMany` to `bulkWrite` with `upsert: true` — re-uploads update existing students instead of failing on duplicates; returns `insertedCount`/`updatedCount`.
- **`updateStudent`**: moved rollNo uniqueness check BEFORE `findByIdAndUpdate` — prevents saving duplicates.
- **`getStudentsWithoutPagination`**: added `.limit(10000).lean()` to prevent unbounded queries.
- **Upload controller**: passes `originalFilename` for file-type detection; returns 400 for validation errors; error message mentions `.xlsx`.

---

## 13. Amount-wise / Participation List PDF Overhaul
- Replaced `html2pdf.js` / `html2canvas` approach with **jsPDF + jspdf-autotable** for direct PDF generation.
- Professional branded layout: IQ Nexus logo, org name, school info, exam details, academic year in header (on every page).
- autoTable with styled headers (dark blue), alternating row colors, dynamic exam columns.
- Footer with confidential notice, page numbers ("Page X of Y"), copyright.
- Signature section with Exam Incharge / Principal lines, total students count, total amount.
- Filename changed from `Attendance_...` to `CostWise_Participation_...`; downloads directly instead of opening in new tab.

---

## 14. Section Participation List PDF Overhaul
- **Major refactor**: replaced `html2canvas` DOM-screenshot approach (~150 lines of brittle DOM manipulation removed) with programmatic `jsPDF + jspdf-autotable`.
- Professional layout: decorative page borders (navy/gold), centered logo (base64), structured header, school metadata in two-column layout.
- Navy exam name banner per exam; autoTable per exam with themed grid, alternating row colors, styled totals row.
- Signature footer (Information Filled By / Mobile No / Sign fields), page number, "CONFIDENTIAL" footer.
- Each exam gets its own page; proper filtering for KD vs regular exams.

---

## 15. School Participation List PDF Improvements
- Added "Principal / Head of Institution" signature line with horizontal rule with total students count.
- Updated note text: more detailed disclaimer about certificate re-printing with proper wrapping (`maxWidth`).

---

## 16. Client-Side Result Card PDF Rewrite
- **Complete rewrite** of `resultCard.js` (~490 lines removed, ~340 lines added): replaced `html2canvas` + inline HTML template with fully programmatic **jsPDF + jspdf-autotable** approach.
- Navy/gold color scheme (`#1a365d`, `#c9a84c`), double decorative border, centered logo loaded as base64.
- Student info via autoTable with 2-column key/value grid with blue-tinted labels.
- Section performance table with header row, alternate row colors, bold grand-total row (white-on-navy).
- Color-coded qualified status (green YES / red NO).
- Rankings consolidated into info table rows.
- PDF viewer popup restyled: navy header, gold download button branded to IQ Nexus.
- **Results.jsx** (client): added absent/disqualified banner, dynamic rankings boxes (school/class/section/zonal/national/international), "Qualified for Level 2" status bar, topic performance/SPR table with color-coded ratings (EXCELLENT → BAD), rating legend, and footer.
- Fixed "MARK SCORED" display: now uses `totalScore / (totalMaxScore || totalMarks || 100)`.
- Added `jspdf-autotable` dependency and `"dev"` script alias in client `package.json`.

---

## 17. Certificate Service Updates
- **Complete PDF redesign**: professional certificate layout with navy + gold double border, decorative accent lines, "IQ NEXUS — International Olympiad Examinations" branding, "Certificate of Participation" text, student name in uppercase, school-specific description, formatted date, three-column signature section (Exam Incharge / Student / Director), copyright footer.
- **ESM fix**: added `__filename`/`__dirname` derivation via `fileURLToPath`.
- **Logo path fix**: changed from `path.join(__dirname, "assets", ...)` to `path.join(__dirname, "..", "assets", ...)`.

---

## 18. Study Material Page Rework
- **Multi-class selection**: changed from single `<select>` to **react-select multi-select** component.
- `formData.class` (string) → `formData.classes` (array) with `classOptions` (Kindergarten + Class 1–12).
- **Batch upload**: loops through each selected class and posts separate requests per class, reporting success/fail counts.
- Auto-resets KG section when kindergarten is deselected.

---

## 19. School Upload Validation
- `excelToMongoForSchool.js`: added upfront header validation (required: `School Code`, `School Name`), minimum column count, extracted `expectedColumns` array.
- `uploadSchoolData`: returns HTTP 400 (not 500) for validation/format errors.

---

## 20. CSV/Upload Validation Improvements
- `excelToMongoForKGStudents.js`: added upfront header validation (required: `Roll No`, `School Code`, `Student Name`, `Section`), minimum column count. Removed inline `on("headers")` validation and verbose debug logs. Fetches and attaches current calendar year during bulk import.
- `excelToMongoForStudent.js`: same calendar year attachment for regular student bulk uploads.

---

## 21. All Kindergarten Students — Filter Bug Fix
- Fixed `handleClearFilters` so it passes the empty filter object to `fetchStudents` instead of stale state (React async state issue).
- On page change, passes current `searchData` filters to `fetchStudents` to maintain context.

---

## 22. Backend Model Cleanup
- **admin.js**: removed `unique: true` constraint from the `password` field (passwords should not be unique across admins).
- **schoolModel.js**: removed inline `dotenv.config()` and `mongoose.connect()` calls (connection should be managed centrally).
- **admitCardService.js**: removed code that wiped the entire `./outputs` directory before generating new admit cards.

---

## 23. Backend Refactors (Other Controllers)
- `AdvanceEntryController.js`: ~46 lines of code cleanup and refactoring.
- `AnswerController.js`: minor fixes (~5 lines).
- `BLQListController.js`: significant simplification (~131 lines reduced).
- `ExamInchargeController.js`: improvements (~23 lines).
- `certificateController.js`: fixed crash when `fetchDataByMobile` returns array vs object — normalizes with `Array.isArray()` check.
- `kindergartenController.js`: added calendar year attachment (~6 lines).

---

## 24. Sidebar Navigation Updates
- Added nav items: **Calendar Year**, **Subject Management**, **Ranking & Results** (with `BarChart3` icon).
- Added **Prize** dropdown with sub-items: Prize Config, Prize Tag, Prize Override.
- New icons: `CalendarDays`, `Trophy`, `BookOpen`, `BarChart3`, `Award` from `lucide-react`.

---

## 25. Route Registration
- Registered 5 new route modules in backend route index: `calendarYearRoutes`, `prizeConfigRoutes`, `prizeTagRoutes`, `subjectRoutes`, `rankingRoutes`.
- Added `getAllSchoolsNoPagination` to school routes.
