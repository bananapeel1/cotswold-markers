import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!keyPath && !keyJson) {
  console.error("Error: Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS");
  process.exit(1);
}

let credential;
if (keyJson) {
  credential = cert(JSON.parse(keyJson) as ServiceAccount);
} else {
  credential = cert(JSON.parse(readFileSync(keyPath!, "utf-8")) as ServiceAccount);
}

const app = initializeApp({ credential });
const db = getFirestore(app);

// Royalty-free Unsplash photos of Cotswold Way / English countryside
const STOCK_IMAGES: Record<string, string> = {
  "cw-01-chipping-campden": "https://images.unsplash.com/photo-1588974269162-4c0e41dd5e5e?w=600&q=80", // Chipping Campden high street
  "cw-02-broadway-tower": "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&q=80", // English countryside tower
  "cw-03-broadway-village-green": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80", // Village green
  "cw-04-stanway-house": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&q=80", // English manor house
  "cw-05-hailes-abbey": "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=600&q=80", // Abbey ruins
  "cw-06-winchcombe": "https://images.unsplash.com/photo-1589459072535-550f4fae08d4?w=600&q=80", // Cotswold town
  "cw-07-cleeve-common": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80", // Rolling hills
  "cw-08-leckhampton-hill": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", // Hill viewpoint
  "cw-09-coopers-hill": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80", // Woodland
  "cw-10-painswick": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80", // Stone village
  "cw-11-standish-wood": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80", // Forest path
  "cw-12-kings-stanley": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80", // Valley landscape
  "cw-13-dursley": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80", // Market town
  "cw-14-wotton-under-edge": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80", // Hill edge
  "cw-15-old-sodbury": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", // Countryside
};

async function addImages() {
  console.log("Adding stock images to markers...\n");

  const snapshot = await db.collection("markers").get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const isLocalPath = !data.imageUrl || data.imageUrl.startsWith("/images/");
    if (isLocalPath) {
      const stockUrl = STOCK_IMAGES[doc.id] || "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&q=80";
      await doc.ref.update({ imageUrl: stockUrl });
      console.log(`  + ${doc.id} → stock image added`);
      updated++;
    } else {
      console.log(`  ✓ ${doc.id} → already has external image`);
    }
  }

  console.log(`\nDone! ${updated} markers updated with stock images.`);
}

addImages().catch(console.error);
