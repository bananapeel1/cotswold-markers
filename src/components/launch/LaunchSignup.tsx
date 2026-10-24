"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { launchListSignupSchema } from "@/lib/validation/launchList";
import { copyFor, signupWordsFor, type Moment } from "@/content/launch";
import Arrow from "./Arrow";
import { sunTimes, ukTime } from "@/lib/launch/sun";

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

const TIMES = ["08:00", "09:30", "11:00", "13:00"];

const longDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

export default function LaunchSignup({
  moment,
  walkMin,
  walkDefault,
}: {
  moment: Moment;
  /** Earliest walk day to offer (YYYY-MM-DD). */
  walkMin: string;
  walkDefault: string;
}) {
  const words = signupWordsFor(moment);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState(false);
  const [leader, setLeader] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [day, setDay] = useState(walkDefault);
  const [time, setTime] = useState("09:30");

  const emailRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const id = useId();

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

    const parsed = launchListSignupSchema.safeParse({ email, notes, leader, source, website });
    if (!parsed.success) {
      setEmailError(parsed.error.issues.find((i) => i.path[0] === "email")?.message ?? "Please check your email address");
      const el = emailRef.current;
      if (el) {
        // restart the shake even if it ran a moment ago
        el.classList.remove("shake");
        void el.offsetWidth;
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) el.classList.add("shake");
        el.focus();
      }
      return;
    }

    setEmailError("");
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

  const walkDay = day && day >= walkMin ? day : walkDefault;
  const sun = sunTimes(walkDay);
  const shareText = `Fancy walking the Cotswold Way from Chipping Campden with me on ${longDay(walkDay)}? ${
    moment === "before" ? "There'll be story markers on the posts by then." : "There are story markers on the posts."
  } Setting off at ${time}. trailtap.uk`;
  const today = new Date();
  const stampDay = today
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })
    .toUpperCase();
  const stampYear = today.toLocaleDateString("en-GB", { year: "numeric", timeZone: "Europe/London" });

  return (
    <form className="signup" noValidate onSubmit={handleSubmit} aria-labelledby="paperh">
      {!done ? (
        <div>
          <div className="field">
            <label className="lbl" htmlFor={`${id}-email`}>
              Your email
            </label>
            <input
              ref={emailRef}
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={warmUp}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={`${id}-email-err`}
            />
            <span className="err" id={`${id}-email-err`} role="alert">
              {emailError}
            </span>
          </div>

          {/* Honeypot: off-screen and skipped by keyboard and screen readers */}
          <div aria-hidden="true" className="hp">
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

          <label className="check" htmlFor={`${id}-notes`}>
            <input id={`${id}-notes`} type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
            <span>
              {words.notesLabel}
              <small>{words.notesHint}</small>
            </span>
          </label>
          <label className="check" htmlFor={`${id}-leader`}>
            <input id={`${id}-leader`} type="checkbox" checked={leader} onChange={(e) => setLeader(e.target.checked)} />
            <span>
              {words.leaderLabel}
              <small>{words.leaderHint}</small>
            </span>
          </label>

          {formError && (
            <p role="alert" className="formerr">
              {formError}
            </p>
          )}

          <button className="btn btn-primary wide" type="submit" aria-disabled={sending || undefined}>
            {sending ? "Sending…" : "Send me the stories"} <Arrow />
          </button>
          <p className="fine">
            {words.button} <a href="#promises">Our promises</a> · <Link href="/privacy">Privacy</Link>
          </p>
        </div>
      ) : (
        <div className="done" ref={doneRef} tabIndex={-1} aria-labelledby={`${id}-done-h`}>
          <svg className="postmark" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path id={`${id}-arc`} d="M50 50 m-39 0 a39 39 0 1 1 78 0 a39 39 0 1 1 -78 0" fill="none" />
            <text>
              <textPath href={`#${id}-arc`}>TRAILTAP · ON THE LIST · COTSWOLD WAY ·</textPath>
            </text>
            <text x="50" y="47" textAnchor="middle" style={{ fontSize: 13, letterSpacing: ".02em" }}>
              {stampDay}
            </text>
            <text x="50" y="61" textAnchor="middle" style={{ fontSize: 10 }}>
              {stampYear}
            </text>
          </svg>
          <h3 id={`${id}-done-h`}>You&rsquo;re on the list.</h3>
          <p>
            {copyFor(moment).firstStory}{" "}
            While you&rsquo;re here: when do you think you&rsquo;ll walk it?
          </p>
          <div className="row">
            <div className="field">
              <label className="lbl" htmlFor={`${id}-day`}>
                Day
              </label>
              <input id={`${id}-day`} type="date" min={walkMin} value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl" htmlFor={`${id}-time`}>
                Setting off
              </label>
              <select id={`${id}-time`} value={time} onChange={(e) => setTime(e.target.value)}>
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="fine" aria-live="polite">
            That day at Chipping Campden: sunrise {ukTime(sun.rise)}, sunset {ukTime(sun.set)}.
          </p>
          <div className="share">
            <a className="btn btn-primary" href={`/api/calendar?day=${walkDay}&time=${encodeURIComponent(time)}`}>
              Add it to my calendar
            </a>
            <a
              className="btn btn-ghost"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send to whoever you walk with
            </a>
          </div>
          <p className="fine">Changed your mind? Every email has an unsubscribe link.</p>
        </div>
      )}
    </form>
  );
}
