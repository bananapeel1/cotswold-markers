/**
 * Launch list storage. Sign-ups live in the `launchList` Firestore collection
 * for now (server-only: firestore.rules denies client access by default).
 *
 * The route only talks to the LaunchListStore interface, so an email tool
 * with double opt-in (MailerLite, Brevo, Buttondown, …) can replace or sit
 * alongside Firestore later by implementing `add` and returning it from
 * getLaunchListStore().
 */

import { createHash } from "node:crypto";
import { getDb } from "@/lib/firebase";

export interface LaunchListEntry {
  /** Trimmed and lowercased. */
  email: string;
  /** The exact tick-box wording the person agreed to, as the consent record. */
  consentText: string;
  consentVersion: string;
  /** Channel from ?from= / ?utm_source=, e.g. "instagram". */
  source: string | null;
  status: "subscribed";
  createdAt: string;
}

export interface LaunchListStore {
  /** Resolves "exists" (and changes nothing) if the email is already on the list. */
  add(entry: LaunchListEntry): Promise<"added" | "exists">;
}

/** Doc ID = SHA-256 of the email, so re-sign-ups dedupe without a query. */
export function launchListDocId(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

// gRPC status code Firestore returns from create() when the doc already exists
const ALREADY_EXISTS = 6;

export const firestoreLaunchListStore: LaunchListStore = {
  async add(entry) {
    const ref = getDb().collection("launchList").doc(launchListDocId(entry.email));
    try {
      await ref.create(entry);
      return "added";
    } catch (e) {
      if ((e as { code?: number }).code === ALREADY_EXISTS) return "exists";
      throw e;
    }
  },
};

export function getLaunchListStore(): LaunchListStore {
  return firestoreLaunchListStore;
}
