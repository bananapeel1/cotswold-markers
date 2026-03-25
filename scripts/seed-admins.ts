import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Load service account
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!keyPath && !keyJson) {
  console.error(
    "Error: Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS"
  );
  process.exit(1);
}

let credential;
if (keyJson) {
  credential = cert(JSON.parse(keyJson) as ServiceAccount);
} else {
  credential = cert(
    JSON.parse(readFileSync(keyPath!, "utf-8")) as ServiceAccount
  );
}

const app = initializeApp({ credential });
const db = getFirestore(app);

const ADMINS = [
  { email: "arongijsel@gmail.com", name: "Aron Gijsel" },
  { email: "gareth.broome@icloud.com", name: "Gareth Broome" },
];

async function seed() {
  console.log("Seeding allowedAdmins...\n");

  for (const admin of ADMINS) {
    await db.collection("allowedAdmins").doc(admin.email).set({
      email: admin.email,
      name: admin.name,
      addedAt: new Date(),
    });
    console.log(`  + ${admin.email}`);
  }

  console.log(`\nDone! ${ADMINS.length} admins whitelisted.`);
}

seed().catch(console.error);
