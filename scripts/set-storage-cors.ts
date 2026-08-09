/**
 * One-time: allow the website to fetch admin-uploaded route geometry from
 * Firebase Storage via XHR (Mapbox loads GeoJSON with fetch, which needs CORS;
 * audio playback never did, so the bucket has no CORS policy yet).
 *
 * Usage:  npx tsx scripts/set-storage-cors.ts
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const BUCKET = "thecotswoldsway-2c218.firebasestorage.app";

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

async function main() {
  const bucket = getStorage(app).bucket(BUCKET);
  await bucket.setCorsConfiguration([
    {
      origin: [
        "https://trail.thecotswoldsway.com",
        "http://localhost:3000",
      ],
      method: ["GET", "HEAD"],
      responseHeader: ["Content-Type"],
      maxAgeSeconds: 3600,
    },
  ]);
  console.log(`✓ CORS set on ${BUCKET} (GET/HEAD from the site origins)`);
}

main().catch((err) => {
  console.error("Failed to set CORS:", err);
  process.exit(1);
});
