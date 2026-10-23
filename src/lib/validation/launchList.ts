/**
 * Launch list sign-up — shared by the homepage form (inline errors) and
 * POST /api/launch-list (server-side gate), like the content schemas.
 *
 * Pressing the button is the consent for the few emails described next to
 * it; the two boxes are separate, unticked choices. The exact words shown
 * live in src/content/launch.ts (signupWordsFor) and are stored with each
 * sign-up as the consent record.
 */

import { z } from "zod";

export const launchListSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your email address")
    .max(254, "That email address is too long")
    .pipe(z.email("That doesn't look like an email address. Check for a missing @ or dot.")),
  /** Ticked "Also send Notes from the north end / the trail". */
  notes: z.boolean().optional().default(false),
  /** Ticked "I lead walks, or run an inn or holiday company". */
  leader: z.boolean().optional().default(false),
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
