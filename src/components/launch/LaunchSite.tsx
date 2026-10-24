import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import {
  CONTACT_EMAIL,
  DEMO_PHOTO,
  OPENS,
  PROMISES,
  QUESTIONS,
  copyFor,
  type Moment,
} from "@/content/launch";
import HiddenLayerHero from "./HiddenLayerHero";
import PlateShows from "./PlateShows";
import TrailWalk from "./TrailWalk";
import LaunchMotion from "./LaunchMotion";
import LaunchSignup from "./LaunchSignup";
import "./launch.css";

// Map lettering and the italic half of the headings
const mapSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  variable: "--font-map",
  display: "swap",
});

// Before the scripts load, motion-gated elements are hidden by `.js`; if the
// scripts never arrive (a dropped signal), show everything after 5 seconds.
const GATE = `(function(e){e.classList.add("js");setTimeout(function(){if(!e.classList.contains("ready"))e.classList.remove("js")},5000)})(document.currentScript.parentElement)`;

/** First Saturday on or after a day: the default walk day in the planner. */
function saturdayFrom(day: string): string {
  const t = new Date(`${day}T12:00:00Z`);
  while (t.getUTCDay() !== 6) t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 864e5);

export default function LaunchSite({
  moment,
  day,
  preview,
}: {
  moment: Moment;
  /** The UK date the page is drawn for (YYYY-MM-DD). */
  day: string;
  /** Set on the review pages: shows a banner and pins the live clock to `day`. */
  preview?: { label: string };
}) {
  const c = copyFor(moment);
  const before = moment === "before";
  const whole = moment === "whole";
  const walkMin = day > OPENS.firstStretch ? day : OPENS.firstStretch;
  const days = daysBetween(day, OPENS.firstStretch);
  const plates = whole ? 50 : 20;

  return (
    <div className={`ll ${mapSerif.variable}`} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: GATE }} />
      {preview && (
        <p className="preview" role="note">
          Preview: {preview.label}. Sign-ups from this page go to a test list.
          <Link href="/launch-preview/before">Now</Link>
          <Link href="/launch-preview/first">15 March</Link>
          <Link href="/launch-preview/whole">June</Link>
        </p>
      )}

      <header className="top">
        <div className="wrap">
          <a className="brand" href="#hero" aria-label="TrailTap, back to the top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/launch/logo.svg" alt="" width={28} height={28} />
            TrailTap
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#shows">What a plate shows</a>
            <a href="#walk">The first stretch</a>
            <a href="#promises">Our promises</a>
            <a className="btn btn-primary" href="#paper">
              {c.primaryCta}
            </a>
          </nav>
        </div>
      </header>

      <main>
        <HiddenLayerHero
          lede={c.heroLede}
          steps={[
            "Find a TrailTap plate on a waymark post.",
            "Hold your phone to it, like paying contactless. Or point the camera at the code.",
            "Its page opens: the nearest water, food and toilets, the way ahead, and the story. No app, no account.",
          ]}
          cta={c.primaryCta}
        />

        <PlateShows day={day} />

        <TrailWalk heading={c.walkHeading} fullStory={c.fullStory} endText={c.walkEnd} endCta={c.primaryCta} />

        <section className="promise" id="promises" aria-labelledby="h-promise">
          <svg className="rings" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" fill="none" stroke="#2b4334" strokeWidth="10" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="#2b4334" strokeWidth="10" />
            <circle cx="100" cy="100" r="24" fill="#2b4334" />
          </svg>
          <div className="wrap cols">
            <div>
              <h2 id="h-promise" className="rv">
                Here, a preview. <b>At the post: the next mile, the nearest tap, the whole story.</b> For whoever walks up to it.
              </h2>
              <p className="who rv">
                TrailTap is independent and self-funded: a two-person project, not part of any trail organisation.
                Questions come straight to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
            </div>
            <div>
              <h3 className="rv">Our promises</h3>
              <ol>
                {PROMISES.map((p) => (
                  <li key={p} className="rv">
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="join" id="paper" aria-labelledby="h-join">
          <div className="wrap cols">
            <div className="j-head">
              <h2 id="h-join">{c.joinHeading}</h2>
              <p className="count">
                {before && days > 1 ? (
                  <>
                    Chipping Campden to Cleeve Hill, <b>in {days} days</b>. The rest of the Way, on to Bath, follows in
                    June.
                  </>
                ) : (
                  c.joinText
                )}
              </p>
            </div>
            <div className="j-more">
              <div className={`plates${whole ? " fifty" : ""}`} aria-hidden="true">
                {Array.from({ length: plates }, (_, i) => (
                  <span key={i} className="rv" style={{ ["--d" as string]: `${(i % 10) * 0.04}s` }} />
                ))}
              </div>
              <ul className="gets" aria-label="What you'll get">
                {c.gets.map((g) => (
                  <li key={g.when}>
                    <b>{g.when}</b>
                    <span>{g.what}</span>
                  </li>
                ))}
              </ul>
              <div className="groups">
                <h3>Bringing a group{before ? " this spring" : ""}?</h3>
                <p>{c.groupsText}</p>
              </div>
            </div>
            <div className="form-card">
              <h3 id="paperh">{c.paperHeading}</h3>
              <p className="sub">
                {c.paperSub} Using the plates never needs an account or an email: this is only for the stories.
              </p>
              <LaunchSignup moment={moment} walkMin={walkMin} walkDefault={saturdayFrom(walkMin)} />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>
            <b>TrailTap</b>
            <p>
              Plates on the waymark posts of the Cotswold Way: where you are, what&rsquo;s near, and the story of the
              spot. On the trail, follow the Countryside Code: respect, protect,
              enjoy. Close gates, keep dogs under control, take your litter home.
            </p>
            <p>
              Questions? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <nav className="legal" aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </div>
          <div>
            <p>
              Map: route © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> (ODbL).
              Heights: Copernicus DEM via Open-Meteo. The landscape at the top is drawn, not photographed.
            </p>
            <p>Photos from Wikimedia Commons:</p>
            <ul>
              {[
                ...QUESTIONS.map((q) => ({ where: q.where, credit: q.credit, url: q.creditUrl })),
                { where: "Broadway Tower (marker page)", credit: DEMO_PHOTO.credit, url: DEMO_PHOTO.creditUrl },
              ]
                .filter((x, i, a) => a.findIndex((y) => y.url === x.url) === i)
                .map((x) => (
                  <li key={x.url}>
                    <a href={x.url}>{x.where}</a>: {x.credit}
                  </li>
                ))}
            </ul>
            <p>
              The questions come from stories in the TrailTap prototype and are placed by village or landmark. Where the
              plates go is agreed before any map shows it.
            </p>
          </div>
        </div>
      </footer>
      <LaunchMotion />
    </div>
  );
}
