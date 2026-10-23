import type { CSSProperties } from "react";
import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import {
  CONTACT_EMAIL,
  DEMO_PHOTO,
  OPENS,
  PROMISES,
  QUESTIONS,
  copyFor,
  weeksBetween,
  type Moment,
} from "@/content/launch";
import { daylightLine } from "@/lib/launch/sun";
import BigMap from "./BigMap";
import StripMap from "./StripMap";
import HeightProfile from "./HeightProfile";
import FoldMap from "./FoldMap";
import LaunchMotion from "./LaunchMotion";
import LaunchSignup from "./LaunchSignup";
import LiveLine from "./LiveLine";
import TapDemo from "./TapDemo";
import "./launch.css";

// Map lettering only: place names, notes and the italic half of the headings
const mapSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  variable: "--font-map",
  display: "swap",
});

const d = (s: string) => ({ "--d": s }) as CSSProperties;

// Contour lines behind the cover, drawn once on the server
const TOPO = Array.from({ length: 16 }, (_, i) => {
  let path = "";
  for (let x = -40; x <= 1240; x += 40) {
    const y = 60 + i * 46 + Math.sin(x / 170 + i * 0.7) * 22 + Math.sin(x / 61 + i) * 6;
    path += (x === -40 ? "M" : "L") + x + " " + y.toFixed(1) + " ";
  }
  return path;
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

const HEADLINE = ["The", "Cotswold", "Way,"];
const HEADLINE_EM = ["told", "as", "you"];

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
  const ch1 = before ? `In ${weeksBetween(day, OPENS.firstStretch)} weeks` : "Open now";
  const ch2 = whole ? "Open now" : `In ${weeksBetween(day, OPENS.wholeWay)} weeks`;

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
          <a className="brand" href="#top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/launch/logo.svg" alt="" width={28} height={28} />
            TrailTap
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#map">The map</a>
            <a href="#how">How it works</a>
            <a href="#promises">Our promises</a>
            <a className="btn btn-primary" href="#paper">
              {before ? "Get the free map" : "Plan your walk"}
            </a>
          </nav>
        </div>
        <span className="walked" id="walked" aria-hidden="true" />
      </header>

      <main id="top">
        <section className="cover" aria-labelledby="h1">
          <svg className="topo" id="topo" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
            <g>
              {TOPO.map((p, i) => (
                <path key={i} d={p} />
              ))}
            </g>
          </svg>
          <div className="wrap">
            <div>
              <p className="live fadeup" style={d(".1s")}>
                <span className="dot" aria-hidden="true" />
                <LiveLine initial={daylightLine(day)} day={preview ? day : undefined} />
              </p>
              <p className="eyebrow fadeup" style={d(".2s")}>
                {c.eyebrow}
              </p>
              <h1 id="h1" aria-label="The Cotswold Way, told as you walk it.">
                <span aria-hidden="true">
                  {HEADLINE.map((w, i) => (
                    <span key={w}>
                      <span className="w">
                        <span style={{ "--i": i } as CSSProperties}>{w}</span>
                      </span>{" "}
                    </span>
                  ))}
                  <em>
                    {HEADLINE_EM.map((w, i) => (
                      <span key={w}>
                        <span className="w">
                          <span style={{ "--i": i + 3 } as CSSProperties}>{w}</span>
                        </span>{" "}
                      </span>
                    ))}
                    <span className="ul">
                      <span className="w">
                        <span style={{ "--i": 6 } as CSSProperties}>walk</span>
                      </span>{" "}
                      <span className="w">
                        <span style={{ "--i": 7 } as CSSProperties}>it.</span>
                      </span>
                      <svg className="squig" viewBox="0 0 300 12" preserveAspectRatio="none">
                        <path pathLength={1} d="M3 8 C 50 2, 90 11, 140 6 S 230 3, 297 7" />
                      </svg>
                    </span>
                  </em>
                </span>
              </h1>
              <p className="lede fadeup" style={d(".75s")}>
                {c.lede}
              </p>
              <ol className="chapters fadeup" style={d(".9s")} aria-label="Two opening dates">
                <li className={before ? undefined : "open"}>
                  <span className="n">
                    Chapter one <span className={`st${before ? "" : " on"}`}>{ch1}</span>
                  </span>
                  <b>15 March 2027</b>
                  <span className="s">The first stretch: 20 markers from Chipping Campden to Cleeve Hill</span>
                  <span className="bar" aria-hidden="true" />
                </li>
                <li className={whole ? "open" : undefined}>
                  <span className="n">
                    Chapter two <span className={`st${whole ? " on" : ""}`}>{ch2}</span>
                  </span>
                  <b>June 2027</b>
                  <span className="s">The whole Way: 50 markers, all the way to Bath</span>
                  <span className="bar" aria-hidden="true" />
                </li>
              </ol>
              <div className="ctas fadeup" style={d("1.05s")}>
                <a className="btn btn-primary" href="#paper">
                  {c.primaryCta} <span className="ar" aria-hidden="true">→</span>
                </a>
                <a className="btn btn-ghost" href="#map">
                  {c.secondaryCta} <span className="ar dn" aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
            <figure className="sheet fadeup" style={{ ...d(".35s"), margin: 0 }}>
              <div className="hd">
                <div>
                  <div className="mic">
                    <span id="mic">102</span>
                    <small>miles</small>
                  </div>
                  <div className="sub">Chipping Campden to Bath</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/launch/plate.svg"
                  alt=""
                  width={54}
                  height={75}
                  style={{ transform: "rotate(6deg)", borderRadius: 7, filter: "drop-shadow(0 4px 6px rgba(29,48,36,.25))" }}
                />
              </div>
              <BigMap moment={moment} labelledBy="sheet-cap" />
              <figcaption className="leg" id="sheet-cap">
                <span>
                  <span className="sw" style={{ background: "var(--rust)" }} />
                  <b>The first stretch</b>20 markers from 15 March 2027
                </span>
                <span>
                  {whole ? (
                    <>
                      <span className="sw" style={{ background: "var(--rust)" }} />
                      <b>On to Bath</b>All 50 open since June 2027
                    </>
                  ) : (
                    <>
                      <span className="sw dash" />
                      <b>On to Bath</b>30 more in June 2027
                    </>
                  )}
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="idea" aria-labelledby="idea-h">
          <svg className="ghost" viewBox="0 0 200 200" aria-hidden="true">
            <g fill="none" stroke="#f3eee2" strokeWidth="1.2">
              {[30, 46, 62, 78, 94].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} />
              ))}
            </g>
          </svg>
          <div className="wrap">
            <p className="eyebrow rv">Why you won&rsquo;t read the stories here</p>
            <h2 id="idea-h" className="rv" style={d(".1s")}>
              The stories stay <em>on the trail.</em>
            </h2>
            <div className="cols">
              <div>
                <p className="rv" style={d(".2s")}>
                  Each marker&rsquo;s story waits at its post for whoever walks up to it. You&rsquo;ll find out why
                  there&rsquo;s a tower on Broadway Hill standing at the foot of it, not scrolling past it on a sofa.
                </p>
                <p className="rv" style={d(".28s")}>
                  This site is the map that gets you there: where the climbs are, where to fill your water bottle, and
                  which day to go.
                </p>
              </div>
              <ul className="stats rv" style={d(".35s")}>
                <li>
                  <b data-count="20">20</b>
                  <span>markers on the first stretch, from 15 March</span>
                </li>
                <li>
                  <b data-count="50">50</b>
                  <span>markers on the whole Way, from June</span>
                </li>
                <li>
                  <b data-count="102">102</b>
                  <span>miles, Chipping Campden to Bath</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="chead rv" id="map">
          <div className="wrap">
            <p className="eyebrow k">
              <i />
              Chapter one · {before ? "from 15 March 2027" : "open now"}
            </p>
            <h2>The first stretch, Chipping Campden to Cleeve Hill.</h2>
            <p>22 miles, drawn from the real route and heights. Scroll down to walk it south, the way most people do.</p>
          </div>
        </div>

        <section className="strip-sec" aria-label="The first stretch as a strip map, with questions along the way">
          <div className="wrap">
            <div className="legend-row" aria-label="Map key">
              <span>
                <svg width="26" height="8" aria-hidden="true">
                  <line x1="1" y1="4" x2="25" y2="4" stroke="#9a3412" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
                </svg>
                The Cotswold Way
              </span>
              <span>
                <svg width="18" height="12" aria-hidden="true">
                  <path d="M2 10l3-8M7 10l3-8M12 10l3-8" stroke="#a8875a" strokeWidth="1.4" />
                </svg>
                Steep ground
              </span>
              <span>
                <svg width="16" height="16" aria-hidden="true">
                  <rect x="1" y="1" width="14" height="14" rx="4" fill="#f3eee2" stroke="#9a3412" strokeWidth="1.5" />
                  <text x="8" y="12" textAnchor="middle" fontSize="11" fontStyle="italic" className="mapfont" fill="#9a3412">
                    ?
                  </text>
                </svg>
                Something to find out
              </span>
              <span className="serif">Strip map: distance down the page is true, the bends are squeezed to fit</span>
            </div>
            <StripMap moment={moment} answer={c.answer} />
          </div>
        </section>

        <section className="south" aria-labelledby="south-h">
          <div className="chead rv" style={{ paddingTop: 44 }}>
            <div className="wrap">
              <p className="eyebrow k">
                <i />
                Chapter two · {whole ? "open now" : "June 2027"}
              </p>
              <h2 id="south-h">…and on to Bath.</h2>
              <p>{c.southText}</p>
            </div>
          </div>
          <div className="wrap">
            <HeightProfile moment={moment} />
          </div>
        </section>

        <section className="paper" id="paper" aria-labelledby="paperh">
          <div className="wrap">
            <div>
              <FoldMap />
              <ul className="gets" aria-label="What you'll get">
                {c.gets.map((g, i) => (
                  <li key={g.when} className="rv" style={d(`${i * 0.08}s`)}>
                    <b>{g.when}</b>
                    <span>{g.what}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">{c.paperEyebrow}</p>
              <h2 id="paperh">{c.paperHeading}</h2>
              <LaunchSignup moment={moment} walkMin={walkMin} walkDefault={saturdayFrom(walkMin)} />
            </div>
          </div>
        </section>

        <section className="key" id="how" aria-labelledby="howh">
          <div className="wrap">
            <div>
              <p className="eyebrow">How it works · the key to the map</p>
              <h2 id="howh">Find the plate on a post. Scan it, or tap it.</h2>
              <dl className="keytable">
                <dt>
                  <svg width="26" height="34" aria-hidden="true">
                    <rect x="1" y="1" width="24" height="32" rx="5" fill="#f3eee2" stroke="#1d3024" strokeWidth="1.5" />
                    <rect x="7" y="8" width="12" height="12" rx="1" fill="#1d3024" />
                  </svg>
                </dt>
                <dd>
                  <b>A TrailTap marker</b>On a waymark post that&rsquo;s already there. Point your phone&rsquo;s camera at
                  the code, or hold your phone against the plate.
                </dd>
                <dt>
                  <svg width="28" height="24" aria-hidden="true">
                    <path d="M2 4c4-2 8-2 12 1 4-3 8-3 12-1v17c-4-2-8-2-12 1-4-3-8-3-12-1z" fill="none" stroke="#1d3024" strokeWidth="1.6" />
                    <path d="M14 5v17" stroke="#1d3024" strokeWidth="1.4" />
                  </svg>
                </dt>
                <dd>
                  <b>The story of that spot</b>Checked against published sources, with an audio version to listen to as
                  you walk. Only on the post.
                </dd>
                <dt>
                  <svg width="26" height="24" aria-hidden="true">
                    <path d="M8 3c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z" fill="#3f7ea6" />
                    <path d="M16 4v16M21 4v6a3 3 0 0 1-5 0" fill="none" stroke="#1d3024" strokeWidth="1.6" />
                  </svg>
                </dt>
                <dd>
                  <b>The nearest water, food and toilets</b>With distances, opening hours where we know them, and places
                  to stay.
                </dd>
                <dt>
                  <svg width="26" height="24" aria-hidden="true">
                    <path d="M3 12h16M14 6l6 6-6 6" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </dt>
                <dd>
                  <b>The next marker</b>How far, how long, and how much climbing.
                </dd>
                <dt>
                  <svg width="26" height="24" aria-hidden="true">
                    <circle cx="13" cy="12" r="9" fill="none" stroke="#9b1c1c" strokeWidth="1.8" />
                    <path d="M13 7v6M13 16v1" stroke="#9b1c1c" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </dt>
                <dd>
                  <b>Where you are, for emergencies</b>Grid reference, nearest road and a button to share your location.
                </dd>
              </dl>
              <p style={{ margin: "18px 0 0", font: "700 15px/1.4 var(--f-display)" }}>
                Free. It opens in your phone&rsquo;s browser, so there&rsquo;s nothing to download and no account to
                make.
              </p>
            </div>
            <TapDemo day={preview ? day : undefined} />
          </div>
        </section>

        <section className="notes" id="promises" aria-labelledby="ph">
          <div className="wrap">
            <p className="eyebrow">Notes on this map</p>
            <h2 id="ph" style={{ font: "800 clamp(28px,3.4vw,42px)/1.05 var(--f-display)", letterSpacing: "-.025em", margin: "10px 0 0" }}>
              Seven promises
            </h2>
            <ol>
              {PROMISES.map((p) => (
                <li key={p} className="rv">
                  {p}
                </li>
              ))}
            </ol>
            <div className="groups rv">
              <div>
                <h3>Bringing a group{before ? " this spring" : ""}?</h3>
                <p>{c.groupsText}</p>
              </div>
              <a className="btn btn-ghost" href="#paper">
                Get the walk leaders&rsquo; pack
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>
            <b>TrailTap</b>
            <p>
              Stories at the posts of the Cotswold Way. On the trail, follow the Countryside Code: respect, protect,
              enjoy. Close gates, keep dogs under control, take your litter home.
            </p>
            <p>
              Questions? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <p>
              <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
            </p>
          </div>
          <div>
            <p>
              Map: route © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> (ODbL).
              Heights: Copernicus DEM via Open-Meteo.
            </p>
            <p>Photos from Wikimedia Commons:</p>
            <ul>
              {[...QUESTIONS.map((q) => ({ where: q.where, credit: q.credit, url: q.creditUrl })), { where: "Broadway Tower (marker page)", credit: DEMO_PHOTO.credit, url: DEMO_PHOTO.creditUrl }]
                .filter((x, i, a) => a.findIndex((y) => y.url === x.url) === i)
                .map((x) => (
                  <li key={x.url}>
                    <a href={x.url}>{x.where}</a>: {x.credit}
                  </li>
                ))}
            </ul>
            <p>
              The questions come from stories in the TrailTap prototype and are placed by village or landmark. Where the
              markers go is agreed before any map shows it.
            </p>
          </div>
        </div>
      </footer>
      <LaunchMotion />
    </div>
  );
}
