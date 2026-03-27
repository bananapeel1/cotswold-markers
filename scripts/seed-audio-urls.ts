#!/usr/bin/env npx tsx
/**
 * Sync audioUrl fields from stories.json into Firestore.
 * Run after generating audio to update the deployed site.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./secrets/service-account.json npx tsx scripts/seed-audio-urls.ts
 */

import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebase() {
  if (getApps().length) return;

  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    const serviceAccount = JSON.parse(keyJson) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./secrets/service-account.json";
  if (fs.existsSync(credPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf-8")) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }

  console.error("No Firebase credentials found.");
  process.exit(1);
}

async function main() {
  initFirebase();
  const db = getFirestore();

  const storiesPath = path.join(process.cwd(), "public/data/stories.json");
  const stories = JSON.parse(fs.readFileSync(storiesPath, "utf-8"));
  const withAudio = stories.filter((s: { audioUrl?: string }) => s.audioUrl);

  console.log(`Found ${withAudio.length} stories with audioUrl\n`);

  let updated = 0;
  for (const story of withAudio) {
    process.stdout.write(`  ${story.id}... `);
    try {
      await db.collection("stories").doc(story.id).update({ audioUrl: story.audioUrl });
      updated++;
      console.log("done");
    } catch (err: unknown) {
      // If doc doesn't exist, try set with merge
      try {
        await db.collection("stories").doc(story.id).set({ audioUrl: story.audioUrl }, { merge: true });
        updated++;
        console.log("done (merged)");
      } catch (err2) {
        console.log(`FAILED: ${err2 instanceof Error ? err2.message : err2}`);
      }
    }
  }

  console.log(`\nDone! Updated ${updated} Firestore documents.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
