/**
 * Reset the live scan counter in Firestore to zero.
 *
 * The counter (`scanCounts/counts`) was originally seeded with placeholder
 * figures totalling ~11,500. Run this once to clear them so the homepage shows
 * only real taps recorded by /api/scan from that point on.
 *
 * Usage:
 *   npx tsx scripts/reset-scan-counts.ts          # dry run — prints current totals
 *   npx tsx scripts/reset-scan-counts.ts --commit # actually wipes the counter
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS env var.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
const commit = process.argv.includes("--commit");

async function main() {
  const ref = db.collection("scanCounts").doc("counts");
  const doc = await ref.get();

  if (!doc.exists) {
    console.log("scanCounts/counts does not exist — nothing to reset.");
    return;
  }

  const data = doc.data() as Record<string, number>;
  const entries = Object.entries(data).filter(([, v]) => typeof v === "number");
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  console.log(`Current counter: ${entries.length} markers, ${total} total scans`);
  for (const [markerId, count] of entries.sort((a, b) => b[1] - a[1])) {
    console.log(`  ${markerId.padEnd(30)} ${count}`);
  }

  if (!commit) {
    console.log("\nDry run. Re-run with --commit to reset the counter to zero.");
    return;
  }

  await ref.set({});
  console.log("\n✓ Counter reset. The homepage will now show real scans only.");
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
