/**
 * Bootstrap Firestore with data from public/data/*.json
 *
 * Firestore is the durable source of truth for content — the admin dashboard
 * writes there, and the repo JSON is only a first-boot seed / emergency
 * fallback. By default this script therefore only creates documents that do
 * not exist yet; it never touches documents that are already in Firestore.
 *
 * Usage:
 *   npx tsx scripts/seed-firestore.ts            # create missing docs only
 *   npx tsx scripts/seed-firestore.ts --force    # DELETE and re-seed all
 *                                                # content collections,
 *                                                # discarding dashboard edits
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.
 */

import { readFileSync } from "fs";
import path from "path";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DATA_DIR = path.join(__dirname, "..", "public", "data");
const FORCE = process.argv.includes("--force");

// Initialize Firebase Admin
const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!keyJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log(
    "⏭ Skipping Firestore seed — no FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS set."
  );
  process.exit(0);
}

const app = keyJson
  ? initializeApp({ credential: cert(JSON.parse(keyJson) as ServiceAccount) })
  : initializeApp({ projectId: "thecotswoldsway-2c218" });

const db = getFirestore(app);

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function checkDuplicateIds(
  collectionName: string,
  items: Array<{ id: string }>
) {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const item of items) {
    if (seen.has(item.id)) dupes.push(item.id);
    seen.add(item.id);
  }
  if (dupes.length > 0) {
    console.error(
      `  ✗ ${collectionName}: ${dupes.length} DUPLICATE IDs found: ${dupes.join(", ")}`
    );
    console.error(`    Fix these before seeding. Aborting.`);
    process.exit(1);
  }
}

async function deleteCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function seedCollection(
  collectionName: string,
  items: Array<{ id: string; [key: string]: unknown }>
) {
  checkDuplicateIds(collectionName, items);

  if (FORCE) {
    await deleteCollection(collectionName);
  }

  // Only create documents that don't exist yet — existing docs hold live
  // dashboard edits and must never be overwritten by the repo JSON.
  const existingRefs = await db.collection(collectionName).listDocuments();
  const existingIds = new Set(existingRefs.map((ref) => ref.id));

  let batch = db.batch();
  let pending = 0;
  let created = 0;

  for (const item of items) {
    if (existingIds.has(item.id)) continue;
    batch.set(db.collection(collectionName).doc(item.id), item);
    pending++;
    created++;

    // Firestore batches are limited to 500 operations
    if (pending === 450) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  const skipped = items.length - created;
  console.log(
    `  ✓ ${collectionName}: ${created} docs created` +
      (skipped > 0 ? `, ${skipped} existing left untouched` : "")
  );
}

async function main() {
  console.log(
    FORCE
      ? "⚠ FORCE seed: deleting and re-seeding content collections from public/data/*.json\n"
      : "Seeding Firestore from public/data/*.json (create-missing only)\n"
  );

  const markers = readJson<Array<{ id: string }>>("markers.json");
  await seedCollection("markers", markers);

  const businesses = readJson<Array<{ id: string }>>("businesses.json");
  await seedCollection("businesses", businesses);

  const pois = readJson<Array<{ id: string }>>("pois.json");
  await seedCollection("pois", pois);

  const stories = readJson<Array<{ id: string }>>("stories.json");
  await seedCollection("stories", stories);

  // Circular routes + accessible sections live in a single JSON file
  const routesData = readJson<{
    routes: Array<{ id: string }>;
    accessibleSections: Array<{ id: string }>;
  }>("routes.json");
  await seedCollection("routes", routesData.routes);
  await seedCollection("accessibleSections", routesData.accessibleSections);

  // Scan counts (single document) — this is a live counter incremented by
  // /api/scan, so never overwrite it (not even with --force). Only create it
  // if it doesn't exist yet.
  const countsRef = db.collection("scanCounts").doc("counts");
  if ((await countsRef.get()).exists) {
    console.log("  • scanCounts: left untouched (live scan counter)");
  } else {
    await countsRef.set({});
    console.log("  ✓ scanCounts: 1 empty counter doc created");
  }

  console.log("\nDone! Firestore is seeded.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
