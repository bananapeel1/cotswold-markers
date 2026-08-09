/**
 * One-time import of the July 2026 verification audits into the `verification`
 * field on Firestore POI docs, so the admin dashboard starts from the audited
 * state instead of "everything unverified".
 *
 * Sources merged (later ones win when a POI appears in more than one):
 *   1. .claude/poi-verification-progress.json — coordinate checks vs Google Maps
 *   2. health-audit-2026-07.csv   — pharmacies + medical, NHS.uk verified
 *   3. toilet-audit-2026-07.csv   — toilets, council + toiletmap.org.uk verified
 *   4. historic-audit-2026-07.csv — historic sites, Historic England NHLE verified
 *
 * Usage:
 *   npx tsx scripts/import-verification.ts             # dry-run (default)
 *   npx tsx scripts/import-verification.ts --commit    # write to Firestore
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const ROOT = path.join(__dirname, "..");
const AUDIT_DATE = "2026-07-28";
const COMMIT = process.argv.includes("--commit");

const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!keyJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "✗ No FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS set."
  );
  process.exit(1);
}

const app = keyJson
  ? initializeApp({ credential: cert(JSON.parse(keyJson) as ServiceAccount) })
  : initializeApp({ projectId: "thecotswoldsway-2c218" });

const db = getFirestore(app);

interface Verification {
  status: "verified" | "unverified" | "needs-recheck";
  source: string;
  sourceUrl?: string;
  lastVerified: string;
  notes?: string;
}

/** Minimal CSV parser handling quoted fields with embedded commas. */
function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && content[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }

  const [header, ...body] = rows;
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()]))
  );
}

function firstUrl(sources: string): string | undefined {
  const match = sources.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[;,]$/, "") : undefined;
}

function main() {
  const verifications = new Map<string, Verification>();

  // 1. Coordinate verification phases (Google Maps checks)
  const progressPath = path.join(ROOT, ".claude", "poi-verification-progress.json");
  if (existsSync(progressPath)) {
    const progress = JSON.parse(readFileSync(progressPath, "utf-8")) as {
      verified?: string[];
    };
    for (const id of progress.verified ?? []) {
      verifications.set(id, {
        status: "verified",
        source: "Location check against Google Maps",
        lastVerified: AUDIT_DATE,
      });
    }
    console.log(`  progress file: ${progress.verified?.length ?? 0} location checks`);
  }

  // 2. Health audit — NHS.uk verified
  const healthPath = path.join(ROOT, "health-audit-2026-07.csv");
  if (existsSync(healthPath)) {
    const rows = parseCsv(readFileSync(healthPath, "utf-8"));
    for (const r of rows) {
      if (!r.id) continue;
      verifications.set(r.id, {
        status: "verified",
        source: "NHS.uk",
        sourceUrl: firstUrl(r.sources ?? ""),
        lastVerified: AUDIT_DATE,
        ...(r.notes ? { notes: r.notes } : {}),
      });
    }
    console.log(`  health audit: ${rows.length} rows`);
  }

  // 3. Toilet audit — council pages + toiletmap.org.uk
  const toiletPath = path.join(ROOT, "toilet-audit-2026-07.csv");
  if (existsSync(toiletPath)) {
    const rows = parseCsv(readFileSync(toiletPath, "utf-8"));
    for (const r of rows) {
      if (!r.id) continue;
      const notes = [
        r.notes,
        r.radar_key === "yes" ? "RADAR key needed for accessible toilet." : "",
      ]
        .filter(Boolean)
        .join(" ");
      verifications.set(r.id, {
        status: "verified",
        source: "Council / Great British Public Toilet Map",
        sourceUrl: firstUrl(r.sources ?? ""),
        lastVerified: AUDIT_DATE,
        ...(notes ? { notes } : {}),
      });
    }
    console.log(`  toilet audit: ${rows.length} rows`);
  }

  // 4. Historic audit — Historic England NHLE
  const historicPath = path.join(ROOT, "historic-audit-2026-07.csv");
  if (existsSync(historicPath)) {
    const rows = parseCsv(readFileSync(historicPath, "utf-8"));
    for (const r of rows) {
      if (!r.id) continue;
      verifications.set(r.id, {
        status: "verified",
        source: r.nhle ? "Historic England (NHLE)" : "Historic England",
        sourceUrl: firstUrl(r.primary_source ?? ""),
        lastVerified: AUDIT_DATE,
      });
    }
    console.log(`  historic audit: ${rows.length} rows`);
  }

  console.log(`\n  ${verifications.size} POIs with verification records\n`);

  apply(verifications).catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
}

async function apply(verifications: Map<string, Verification>) {
  const snapshot = await db.collection("pois").get();
  const existing = new Map(snapshot.docs.map((d) => [d.id, d.data()]));

  let applied = 0;
  let skippedMissing = 0;
  let alreadySet = 0;

  let batch = db.batch();
  let pending = 0;

  for (const [id, verification] of verifications) {
    const doc = existing.get(id);
    if (!doc) {
      skippedMissing++;
      continue;
    }
    if (doc.verification?.status === "verified") {
      alreadySet++;
      continue;
    }
    applied++;
    if (COMMIT) {
      batch.update(db.collection("pois").doc(id), { verification });
      pending++;
      if (pending === 450) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }

  if (COMMIT && pending > 0) await batch.commit();

  console.log(
    `${COMMIT ? "✓ Applied" : "Would apply (dry-run — pass --commit to write)"}: ` +
      `${applied} verifications; ${alreadySet} already verified; ` +
      `${skippedMissing} audit ids with no matching POI (fine — audits also record rejected entries)`
  );
}

main();
