/**
 * One-time migration: KG taxonomy
 *   Old: class = "KD", section = PG | LKG | UKG
 *   New: class = NURSERY | LKG | UKG (PG → NURSERY), section = A | B | C …
 *
 * Usage (from iqnexus-backend-main):
 *   node utils/migrateKgClassSection.js
 *   node utils/migrateKgClassSection.js --dry-run
 *
 * Requires MONGO_URI / MONGODB_URI in env (or defaults to local docker URI).
 */
import mongoose from "mongoose";
import { KINDERGARTEN_STUDENT } from "../models/kindergarten.model.js";
import { normalizeKgClass, normalizeKgSection, KG_CLASSES } from "./kgHelpers.js";
import { StudyMaterial } from "../services/studyMaterialService.js";

const dryRun = process.argv.includes("--dry-run");

async function migrateStudents() {
  const students = await KINDERGARTEN_STUDENT.find({}).lean();
  let updated = 0;
  let skipped = 0;

  for (const s of students) {
    const oldClass = s.class;
    const oldSection = s.section;

    let newClass = normalizeKgClass(oldClass);
    // Legacy: class was always KD and real class lived in section
    if (!newClass || newClass === null) {
      newClass = normalizeKgClass(oldSection) || "NURSERY";
    }
    if (oldClass === "KD" || String(oldClass).toUpperCase() === "KD") {
      newClass = normalizeKgClass(oldSection) || "NURSERY";
    }

    let newSection = normalizeKgSection(oldSection);
    // If section was actually a class label, default to A
    if (!newSection) {
      newSection = "A";
    }

    if (oldClass === newClass && oldSection === newSection) {
      skipped += 1;
      continue;
    }

    console.log(
      `  ${s.rollNo}: class ${oldClass}→${newClass}, section ${oldSection}→${newSection}`
    );

    if (!dryRun) {
      await KINDERGARTEN_STUDENT.updateOne(
        { _id: s._id },
        { $set: { class: newClass, section: newSection } }
      );
    }
    updated += 1;
  }

  return { total: students.length, updated, skipped };
}

async function migrateStudyMaterials() {
  // Materials stored as class: "kindergarten" + kgSection: PG/LKG/UKG
  const materials = await StudyMaterial.find({
    $or: [
      { class: "kindergarten" },
      { class: "KD" },
      { kgSection: { $in: ["PG", "LKG", "UKG", "LK", "UK", "NURSERY"] } },
    ],
  }).lean();

  let updated = 0;
  for (const m of materials) {
    const newClass =
      normalizeKgClass(m.class) ||
      normalizeKgClass(m.kgSection) ||
      null;
    if (!newClass) continue;

    console.log(
      `  study-material ${m._id}: class ${m.class}/${m.kgSection} → ${newClass}`
    );
    if (!dryRun) {
      await StudyMaterial.updateOne(
        { _id: m._id },
        {
          $set: {
            class: newClass,
            // Clear class-as-section; section letters can be set later if needed
            kgSection: normalizeKgSection(m.kgSection) || "",
          },
        }
      );
    }
    updated += 1;
  }
  return { total: materials.length, updated };
}

async function main() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/Epoch-olympiad-foundation_New";

  console.log(`Connecting to ${uri}${dryRun ? " (DRY RUN)" : ""}`);
  await mongoose.connect(uri);

  console.log("\n== KG students ==");
  const students = await migrateStudents();
  console.log(students);

  console.log("\n== Study materials ==");
  try {
    const mats = await migrateStudyMaterials();
    console.log(mats);
  } catch (err) {
    console.warn("Study material migration skipped:", err.message);
  }

  console.log(`\nAllowed classes: ${KG_CLASSES.join(", ")}`);
  await mongoose.disconnect();
  console.log(dryRun ? "Dry run complete — no writes." : "Migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
