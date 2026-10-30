/**
 * Kindergarten class/section taxonomy helpers.
 *
 * Class = NURSERY | LKG | UKG  (PG / Play Group → NURSERY)
 * Section = A, B, C, … (free text, not PG/LKG/UKG)
 */

export const KG_CLASSES = ["NURSERY", "LKG", "UKG"];

/** Legacy values that may still exist before migration */
export const LEGACY_KG_CLASS_VALUES = ["KD", "kindergarten", "KINDERGARTEN"];

const CLASS_ALIASES = {
  NURSERY: "NURSERY",
  NR: "NURSERY",
  NSY: "NURSERY",
  PG: "NURSERY",
  "PLAY GROUP": "NURSERY",
  PLAYGROUP: "NURSERY",
  "PRE-PRIMARY": "NURSERY",
  PREPRIMARY: "NURSERY",
  LKG: "LKG",
  LK: "LKG",
  "LOWER KINDERGARTEN": "LKG",
  UKG: "UKG",
  UK: "UKG",
  UKD: "UKG",
  "UPPER KINDERGARTEN": "UKG",
};

/**
 * Normalize a raw class/section label to NURSERY | LKG | UKG | null
 */
export function normalizeKgClass(value) {
  if (value === undefined || value === null || value === "") return null;
  const key = String(value).trim().toUpperCase();
  if (CLASS_ALIASES[key]) return CLASS_ALIASES[key];
  if (KG_CLASSES.includes(key)) return key;
  return null;
}

/**
 * True if value is a KG class (including legacy KD / kindergarten)
 */
export function isKgClass(value) {
  if (value === undefined || value === null || value === "") return false;
  const key = String(value).trim().toUpperCase();
  if (normalizeKgClass(key)) return true;
  return LEGACY_KG_CLASS_VALUES.map((v) => v.toUpperCase()).includes(key);
}

/**
 * Mongo query fragment matching all KG students (new + legacy KD rows)
 */
export function kgStudentsClassQuery() {
  return { class: { $in: [...KG_CLASSES, "KD"] } };
}

/**
 * Normalize section to a school section letter/name (A, B, C…).
 * Rejects old class-as-section values by returning empty string for those.
 */
export function normalizeKgSection(value) {
  if (value === undefined || value === null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  // Old taxonomy mistakenly stored class in section — treat as empty section
  if (normalizeKgClass(upper) || LEGACY_KG_CLASS_VALUES.map((v) => v.toUpperCase()).includes(upper)) {
    return "";
  }
  return raw.toUpperCase();
}

/**
 * Map study-material / UI "kindergarten" bucket + legacy kgSection to a real class
 */
export function resolveStudyMaterialKgClass(classValue, kgSection) {
  const fromClass = normalizeKgClass(classValue);
  if (fromClass) return fromClass;
  const fromSection = normalizeKgClass(kgSection);
  if (fromSection) return fromSection;
  if (String(classValue).toLowerCase() === "kindergarten") {
    return normalizeKgClass(kgSection);
  }
  return null;
}

export function isKindergartenStudent(student = {}) {
  if (isKgClass(student.class) || isKgClass(student.Class)) return true;
  // Legacy rows / field presence
  return (
    student.IQKD1 !== undefined ||
    student.IQKD2 !== undefined ||
    student.iqkdBook !== undefined
  );
}
