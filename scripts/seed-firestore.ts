/**
 * Seed Firestore with data from public/data/*.json
 *
 * Usage:
 *   npx tsx scripts/seed-firestore.ts
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS env var.
 */

import { readFileSync } from "fs";
import path from "path";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DATA_DIR = path.join(__dirname, "..", "public", "data");

// Initialize Firebase Admin
const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!keyJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Error: Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS"
  );
  process.exit(1);
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
  // Check for duplicate IDs before seeding
  checkDuplicateIds(collectionName, items);

  // Delete existing docs to remove stale data
  await deleteCollection(collectionName);

  const batch = db.batch();
  let count = 0;

  for (const item of items) {
    const docRef = db.collection(collectionName).doc(item.id);
    batch.set(docRef, item);
    count++;

    // Firestore batches are limited to 500 operations
    if (count % 450 === 0) {
      await batch.commit();
      console.log(`  Committed batch of ${count} docs...`);
    }
  }

  await batch.commit();
  console.log(`  ✓ ${collectionName}: ${items.length} docs seeded`);
}

async function main() {
  console.log("Seeding Firestore from public/data/*.json\n");

  // Markers
  const markers = readJson<Array<{ id: string }>>("markers.json");
  await seedCollection("markers", markers);

  // Businesses
  const businesses = readJson<Array<{ id: string }>>("businesses.json");
  await seedCollection("businesses", businesses);

  // POIs
  const pois = readJson<Array<{ id: string }>>("pois.json");
  await seedCollection("pois", pois);

  // Stories
  const stories = readJson<Array<{ id: string }>>("stories.json");
  await seedCollection("stories", stories);

  // Scan counts (single document)
  const scanCounts = readJson<Record<string, number>>("scan-counts.json");
  await db.collection("scanCounts").doc("counts").set(scanCounts);
  console.log(`  ✓ scanCounts: 1 doc seeded (${Object.keys(scanCounts).length} markers)`);

  console.log("\nDone! Firestore is seeded.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
