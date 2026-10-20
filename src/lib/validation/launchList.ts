/**
 * Launch list sign-up — shared by the /launch form (inline errors) and
 * POST /api/launch-list (server-side gate), like the content schemas.
 */

import { z } from "zod";

/**
 * The consent wording shown next to the tick box. Stored verbatim with every
 * sign-up as the consent record, so bump CONSENT_VERSION whenever it changes.
 */
export const LAUNCH_LIST_CONSENT_TEXT =
  "Yes, email me TrailTap news: when the markers open and the free printable map.";
export const LAUNCH_LIST_CONSENT_VERSION = "2026-10-20";

export const launchListSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your email address")
    .max(254, "That email address is too long")
    .pipe(z.email("Please enter a valid email address")),
  consent: z.literal(true, {
    error: "Please tick the box so we know you're happy to hear from us",
  }),
  /** Where the visitor came from (?from= or ?utm_source=), e.g. "instagram". */
  source: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{1,40}$/)
    .optional()
    .catch(undefined),
  /** Honeypot: hidden from people, so anything in it came from a bot. */
  website: z.string().optional(),
});

export type LaunchListSignup = z.infer<typeof launchListSignupSchema>;
