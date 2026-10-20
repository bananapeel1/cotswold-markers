"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  launchListSignupSchema,
  LAUNCH_LIST_CONSENT_TEXT,
} from "@/lib/validation/launchList";

type FieldErrors = { email?: string; consent?: string };

/**
 * Firebase (and with it the reCAPTCHA v3 App Check script) loads on first
 * interaction rather than with the page, so the page stays light on a
 * phone signal at the trailhead.
 */
let appCheckLoader: Promise<() => Promise<string | null>> | null = null;
function loadAppCheck() {
  appCheckLoader ??= import("@/lib/firebase-client")
    .then((m) => m.getAppCheckToken)
    .catch((e) => {
      appCheckLoader = null; // let the next attempt retry, e.g. after a dropped signal
      throw e;
    });
  return appCheckLoader;
}

export default function LaunchListForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const id = useId();
  const emailId = `${id}-email`;
  const emailErrorId = `${id}-email-error`;
  const consentId = `${id}-consent`;
  const consentErrorId = `${id}-consent-error`;
  const noteId = `${id}-note`;

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  function warmUp() {
    loadAppCheck()
      .then((getToken) => getToken())
      .catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setFormError("");

    const params = new URLSearchParams(window.location.search);
    const source = params.get("from") || params.get("utm_source") || undefined;

    const parsed = launchListSignupSchema.safeParse({ email, consent, source, website });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "consent") && !next[field]) {
          next[field] = issue.message;
        }
      }
      setErrors(next);
      (next.email ? emailRef : consentRef).current?.focus();
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const getToken = await loadAppCheck().catch(() => null);
      const appCheck = getToken ? await getToken() : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (appCheck) headers["X-Firebase-AppCheck"] = appCheck;

      const res = await fetch("/api/launch-list", {
        method: "POST",
        headers,
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach TrailTap. Check your signal and try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      // Focus moves to the heading, which is what screen readers announce
      <div className="rounded-md bg-primary-fixed/40 p-6">
        <h3
          ref={doneRef}
          tabIndex={-1}
          className="font-headline text-xl font-extrabold text-primary focus:outline-none"
        >
          Thank you. You&rsquo;re on the launch list.
        </h3>
        <p className="mt-3 text-base leading-relaxed text-on-surface">
          Our first note from the north end comes in December. We&rsquo;ll send
          the printable map when it&rsquo;s ready, and an email on Monday 15
          March when the markers open.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          Changed your mind? Every email has an unsubscribe link.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-md bg-surface-container-lowest border-2 text-base text-on-surface font-medium placeholder:text-outline focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:border-primary";

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor={emailId} className="block text-sm font-bold text-on-surface mb-2">
          Email address
        </label>
        <input
          ref={emailRef}
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={warmUp}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? emailErrorId : undefined}
          className={`${inputClass} ${errors.email ? "border-error" : "border-outline"}`}
        />
        {errors.email && (
          <p id={emailErrorId} className="mt-2 text-sm font-bold text-error">
            {errors.email}
          </p>
        )}
      </div>

      {/* Honeypot: off-screen and skipped by keyboard and screen readers */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            ref={consentRef}
            id={consentId}
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            onFocus={warmUp}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${consentErrorId} ${noteId}` : noteId}
            className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-primary"
          />
          <label htmlFor={consentId} className="cursor-pointer text-base leading-snug text-on-surface">
            {LAUNCH_LIST_CONSENT_TEXT}
          </label>
        </div>
        {errors.consent && (
          <p id={consentErrorId} className="mt-2 text-sm font-bold text-error">
            {errors.consent}
          </p>
        )}
      </div>

      <p id={noteId} className="text-sm leading-relaxed text-on-surface-variant">
        We use your email only for TrailTap news and never share or sell it.
        Every email has an unsubscribe link. Read our{" "}
        <Link href="/privacy" className="font-bold text-primary underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>

      {formError && (
        <p role="alert" className="rounded-md bg-error-container px-4 py-3 text-sm font-bold text-on-error-container">
          {formError}
        </p>
      )}

      <button
        type="submit"
        aria-disabled={sending || undefined}
        className="w-full min-h-12 rounded-full bg-primary px-6 py-4 text-base font-bold text-on-primary transition-all hover:bg-primary-container active:scale-[0.98] aria-disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      >
        {sending ? "Adding you to the list…" : "Add me to the list"}
      </button>
    </form>
  );
}
