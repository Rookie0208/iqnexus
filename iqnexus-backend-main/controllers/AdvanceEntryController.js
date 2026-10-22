import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import {
  isKgClass,
  normalizeKgClass,
  normalizeKgSection,
} from "../utils/kgHelpers.js";

import fs from "fs";
import xlsx from "xlsx";

const normalizeYesNo = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim().toUpperCase();
  if (["YES", "Y", "1"].includes(s)) return "1";
  if (["NO", "N", "0"].includes(s)) return "0";
  if (s === "1" || s === "0") return s;
  return undefined;
};

const col = (row, ...names) => {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") return row[name];
    const found = Object.keys(row).find((k) => k.toLowerCase().trim() === name.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
      return row[found];
    }
  }
  return undefined;
};

export const updateAdvanceEntryList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "File is empty. No data found." });
    }

    const fileColumns = Object.keys(data[0]).map((c) => c.toLowerCase());
    const requiredColumns = ["roll no", "class", "school code"];
    // Also accept "Roll No" style from IQKGL2 template
    const hasRoll =
      fileColumns.includes("roll no") ||
      fileColumns.includes("roll no.") ||
      Object.keys(data[0]).some((k) => k.toLowerCase().includes("roll"));
    const hasClass = fileColumns.includes("class");
    const hasSchool =
      fileColumns.includes("school code") ||
      Object.keys(data[0]).some((k) => k.toLowerCase().includes("school"));

    if (!hasRoll || !hasClass || !hasSchool) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error:
          `Invalid file format. Missing required columns: ${requiredColumns.filter((c) => !fileColumns.includes(c)).join(", ")}. ` +
          `Use upper-class L2 template (IAOL2/ITSTL2/…) or IQKGL2 participation template (Class=NURSERY/LKG/UKG, Section=A/B/C, IQKGL2).`,
      });
    }

    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      const rollNo = String(col(row, "roll no", "Roll No", "Roll No.") || "").trim();
      const rawClass = col(row, "class", "Class");
      const schoolCode = Number(col(row, "school code", "School Code"));
      const sectionRaw = col(row, "section", "Section");

      if (!rollNo) {
        skipped += 1;
        continue;
      }

      const kgClass = normalizeKgClass(rawClass);

      if (kgClass) {
        // Kindergarten L2 participation (IQKGL2 template)
        const iqkgl2 = normalizeYesNo(col(row, "IQKGL2", "IQKD2", "IQKG2"));
        const updateFields = {};
        if (iqkgl2 !== undefined) updateFields.IQKD2 = iqkgl2;

        const advPaid = col(
          row,
          "Advance Level Paid Amount",
          "advanceLevelAmountPaid",
          "Advance Level Paid Amount "
        );
        const advFull = col(
          row,
          "Advance Level Full Amount",
          "advanceLevelFullAmount",
          "Total Advance Level Participated Exams"
        );
        if (advPaid !== undefined) updateFields.advanceLevelAmountPaid = String(advPaid);
        if (advFull !== undefined && col(row, "Total Advance Level Participated Exams")) {
          updateFields.totalBasicLevelParticipatedExams = undefined; // don't overwrite L1
          updateFields.advanceLevelAmountPaid = updateFields.advanceLevelAmountPaid;
        }
        const totalAdvExams = col(row, "Total Advance Level Participated Exams");
        if (totalAdvExams !== undefined) {
          // store on a sensible field if present in schema — use advance payment meta only
        }

        const findQuery = {
          rollNo,
          class: kgClass,
          schoolCode,
        };
        if (sectionRaw && normalizeKgSection(sectionRaw)) {
          findQuery.section = normalizeKgSection(sectionRaw);
        }

        const result = await KINDERGARTEN_STUDENT.findOneAndUpdate(
          { rollNo, class: kgClass, schoolCode },
          { $set: updateFields },
          { new: true }
        );

        if (!result) {
          errors.push({
            row: rowNum,
            rollNo,
            error: `KG student not found (class=${kgClass}, school=${schoolCode})`,
          });
          skipped += 1;
        } else {
          updated += 1;
        }
      } else {
        // Upper-class L2
        const updateFields = {
          IAOL2: normalizeYesNo(col(row, "IAOL2", "IQROL2")),
          ITSTL2: normalizeYesNo(col(row, "ITSTL2", "IQSOL2")),
          IMOL2: normalizeYesNo(col(row, "IMOL2", "IQMOL2")),
          IENGOL2: normalizeYesNo(col(row, "IENGOL2", "IQEOL2")),
          advanceLevelAmountPaid: col(
            row,
            "Advance Level Paid Amount",
            "advanceLevelAmountPaid",
            "Advance Level Paid Amount "
          ),
          advanceLevelAmountPaidOnline: col(
            row,
            "Advance Level Amount Paid Online",
            "advanceLevelAmountPaidOnline"
          ),
        };

        // Map IQROL2 style columns used in some templates
        if (updateFields.IAOL2 === undefined) updateFields.IAOL2 = normalizeYesNo(col(row, "IQROL2"));
        if (updateFields.ITSTL2 === undefined) updateFields.ITSTL2 = normalizeYesNo(col(row, "IQSOL2"));
        if (updateFields.IMOL2 === undefined) updateFields.IMOL2 = normalizeYesNo(col(row, "IQMOL2"));
        if (updateFields.IENGOL2 === undefined) updateFields.IENGOL2 = normalizeYesNo(col(row, "IQEOL2"));

        Object.keys(updateFields).forEach((key) => {
          if (updateFields[key] === undefined || updateFields[key] === null) {
            delete updateFields[key];
          }
        });

        const result = await STUDENT_LATEST.findOneAndUpdate(
          {
            rollNo,
            class: rawClass,
            schoolCode,
          },
          { $set: updateFields },
          { new: true }
        );

        if (!result) {
          errors.push({
            row: rowNum,
            rollNo,
            error: `Student not found (class=${rawClass}, school=${schoolCode})`,
          });
          skipped += 1;
        } else {
          updated += 1;
        }
      }
    }

    fs.unlinkSync(filePath);
    res.status(200).json({
      message: "Advance / L2 entry list updated",
      updated,
      skipped,
      errors: errors.slice(0, 50),
      errorCount: errors.length,
    });
  } catch (error) {
    console.error("❌ Error updating advance entry list:", error);
    res.status(500).json({ error: error.message || "Failed to process file" });
  }
};
