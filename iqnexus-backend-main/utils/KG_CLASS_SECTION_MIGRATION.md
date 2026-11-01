# KG Class / Section Taxonomy Migration

## New model

| Field | Values |
|-------|--------|
| **Class** | `NURSERY`, `LKG`, `UKG` (PG / Play Group → `NURSERY`) |
| **Section** | `A`, `B`, `C`, … (school section) |

Subjects (L1/L2) stay as DB fields `IQKD1` / `IQKD2`, labeled **IQKG1** / **IQKG2 (IQKGL2)** in UI. Templates may use column `IQKGL2`.

## Run migration (production / local)

From `iqnexus-backend-main` with Mongo reachable:

```bash
# Preview only
MONGO_URI="mongodb://..." node utils/migrateKgClassSection.js --dry-run

# Apply
MONGO_URI="mongodb://..." node utils/migrateKgClassSection.js
```

On Docker EC2 (example):

```bash
cd /opt/iqnexus
docker-compose -f docker-compose.freetier.yml exec backend \
  node utils/migrateKgClassSection.js --dry-run
```

What it does:

1. For each KG student with `class: "KD"` and `section` in `{PG,LKG,UKG}` → set `class` from section (`PG`→`NURSERY`), set `section` to `A`.
2. Study materials with `class: "kindergarten"` + `kgSection` PG/LKG/UKG → store real class on `class`.

## Templates

- Student / bulk KG: Class = NURSERY|LKG|UKG, Section = A|B|C
- IQKGL2 participation: same Class/Section + `IQKGL2` Yes/No
- Result (Q-response auto-score): download `GET /download-kg-result-template` → `ROLL NO`, `ATTENDANCE`, `CLASS`, `SECTION`, `p1`…`p30`. Upload answer key first, then `/upload-result` auto-scores (NURSERY 20 / LKG 25 / UKG 30).
