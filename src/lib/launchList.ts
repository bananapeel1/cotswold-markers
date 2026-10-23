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
  /** Also send the monthly notes. */
  notes: boolean;
  /** Walk leader, inn or holiday company: send the walk leaders' pack. */
  leader: boolean;
  /**
   * The exact words the person agreed to, as the consent record: the line
   * by the button, plus each box they ticked.
   */
  consentText: { button: string; notes?: string; leader?: string };
  consentVersion: string;
  /** Which version of the site they signed up on: before, first or whole. */
  moment: string;
  /** Channel from ?from= / ?utm_source=, e.g. "instagram". */
  source: string | null;
  status: "subscribed";
  createdAt: string;
}

export interface LaunchListStore {
  /**
   * Resolves "exists" if the email is already on the list. A box ticked now
   * is added to the existing entry; nothing is ever unticked from here.
   */
  add(entry: LaunchListEntry): Promise<"added" | "exists">;
}

/** Doc ID = SHA-256 of the email, so re-sign-ups dedupe without a query. */
export function launchListDocId(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

/**
 * Only the live site writes to the real list. Preview deployments and local
 * runs write to `launchListTest`, so trying the form on a review link never
 * adds anyone to the list that gets emailed.
 */
export const launchListCollection = () =>
  process.env.VERCEL_ENV === "production" ? "launchList" : "launchListTest";

// gRPC status code Firestore returns from create() when the doc already exists
const ALREADY_EXISTS = 6;

export const firestoreLaunchListStore: LaunchListStore = {
  async add(entry) {
    const ref = getDb().collection(launchListCollection()).doc(launchListDocId(entry.email));
    try {
      await ref.create(entry);
      return "added";
    } catch (e) {
      if ((e as { code?: number }).code !== ALREADY_EXISTS) throw e;
      const extra: Record<string, unknown> = {};
      if (entry.notes) {
        extra.notes = true;
        extra.notesConsent = { text: entry.consentText.notes, version: entry.consentVersion, at: entry.createdAt };
      }
      if (entry.leader) {
        extra.leader = true;
        extra.leaderConsent = { text: entry.consentText.leader, version: entry.consentVersion, at: entry.createdAt };
      }
      if (Object.keys(extra).length) await ref.set({ ...extra, updatedAt: entry.createdAt }, { merge: true });
      return "exists";
    }
  },
};

export function getLaunchListStore(): LaunchListStore {
  return firestoreLaunchListStore;
}
