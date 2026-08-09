/**
 * One-time merge of the static SEASONAL_NOTES map (src/data/seasonal.ts) onto
 * the Firestore marker docs, so the "Look Out For" notes become editable per
 * marker in the admin dashboard.
 *
 * Markers that already have a `seasonalNotes` field are skipped — admin edits
 * are never overwritten, so the script is safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/seed-seasonal-notes.ts             # dry-run (default)
 *   npx tsx scripts/seed-seasonal-notes.ts --commit    # write to Firestore
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEASONAL_NOTES } from "../src/data/seasonal";

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

async function main() {
  const snapshot = await db.collection("markers").get();
  const existing = new Map(snapshot.docs.map((d) => [d.id, d.data()]));

  console.log(
    `  ${Object.keys(SEASONAL_NOTES).length} markers in the static map, ` +
      `${existing.size} marker docs in Firestore\n`
  );

  let applied = 0;
  let alreadySet = 0;
  let skippedMissing = 0;

  const batch = db.batch();

  for (const [id, notes] of Object.entries(SEASONAL_NOTES)) {
    const doc = existing.get(id);
    if (!doc) {
      skippedMissing++;
      console.warn(`  ! no marker doc for ${id} — skipped`);
      continue;
    }
    if (Array.isArray(doc.seasonalNotes)) {
      alreadySet++;
      continue;
    }
    applied++;
    if (COMMIT) {
      batch.update(db.collection("markers").doc(id), { seasonalNotes: notes });
    }
  }

  if (COMMIT && applied > 0) await batch.commit();

  console.log(
    `${COMMIT ? "✓ Applied" : "Would apply (dry-run — pass --commit to write)"}: ` +
      `${applied} markers seeded; ${alreadySet} already have seasonalNotes (untouched); ` +
      `${skippedMissing} static ids with no matching marker doc`
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
