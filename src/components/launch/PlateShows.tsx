"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEMO_PAGE, WEATHER_ORDERS } from "@/content/launch";
import { Icon, type IconName } from "./mpIcons";
import PlatePhone, { type Part, type Place } from "./PlatePhone";
import Arrow from "./Arrow";

/**
 * What a plate's page is for, shown on the real Broadway Tower page without
 * leaving this one. On wide screens the page sits in a phone beside the
 * questions: as each question scrolls past, the phone scrolls to its part and
 * lights it up, and the cards can be tapped. On phones each question carries
 * its own piece of the page, and the whole page opens in place.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct-Feb" or "Year-round", as the real page reads them. */
function inSeason(months: string, month: number): boolean {
  if (months === "Year-round") return true;
  const [a, b] = months.split("-").map((m) => MONTHS.indexOf(m) + 1);
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}

type Weather = (typeof WEATHER_ORDERS)[number]["id"];

export default function PlateShows({ day, fullStory }: { day: string; fullStory: string }) {
  const [wx, setWx] = useState<Weather>("rain");
  const [pass, setPass] = useState<{ id: string; key: number } | null>(null);
  const [open, setOpen] = useState<Place | null>(null);
  const [focus, setFocus] = useState<Part | null>(null);
  const [whole, setWhole] = useState(false);
  const root = useRef<HTMLElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const cards = useRef(new Map<string, HTMLElement>());
  const before = useRef<Map<string, DOMRect> | null>(null);
  const sync = useRef<() => void>(() => {});

  const weather = WEATHER_ORDERS.find((w) => w.id === wx)!;
  const discovery = weather.order.map((k) => DEMO_PAGE.discovery.find((d) => d.icon === k)!);
  const month = Number(day.slice(5, 7));
  const look = [...DEMO_PAGE.look]
    .map((n) => ({ ...n, now: inSeason(n.months, month) }))
    .sort((a, b) => Number(b.now) - Number(a.now));

  const cardRef = useCallback(
    (where: string) => (key: string, el: HTMLElement | null) => {
      if (el) cards.current.set(`${where}:${key}`, el);
      else cards.current.delete(`${where}:${key}`);
    },
    [],
  );
  const phoneCard = cardRef("phone");

  const pick = (id: Weather) => {
    if (id === wx) return;
    before.current = new Map([...cards.current].map(([k, el]) => [k, el.getBoundingClientRect()]));
    setWx(id);
    setPass((p) => ({ id, key: (p?.key ?? 0) + 1 }));
  };

  // the cards glide to their new places rather than jumping (inside the phone, in its own scaled units)
  useLayoutEffect(() => {
    const first = before.current;
    before.current = null;
    if (!first || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const [k, el] of cards.current) {
      const a = first.get(k);
      if (!a) continue;
      const b = el.getBoundingClientRect();
      const s = k.startsWith("phone:") ? scale.current : 1;
      const dx = (a.left - b.left) / s;
      const dy = (a.top - b.top) / s;
      if (dx || dy)
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 560,
          easing: "cubic-bezier(.2,.7,.2,1)",
        });
    }
  }, [wx]);

  // fit the page to the phone, and on wide screens let the questions drive it
  useEffect(() => {
    const sec = root.current;
    const pg = page.current;
    const sc = scroller.current;
    if (!sec || !pg || !sc) return;
    const screen = pg.parentElement!;
    const wideQ = matchMedia("(min-width: 901px)");
    const rows = [...sec.querySelectorAll<HTMLElement>("[data-row]")];
    let last: Part | null = null;

    const fit = () => {
      // the frame is never wider than a phone; anything else means the styles haven't arrived yet
      if (!screen.clientWidth || screen.clientWidth > 420) return;
      const s = screen.clientWidth / 390;
      scale.current = s;
      pg.style.transform = `scale(${s})`;
      if (wideQ.matches) {
        screen.style.height = "";
        pg.style.height = `${screen.clientHeight / s}px`;
      } else {
        // phones: the whole page, top to bottom, no scrolling inside it
        pg.style.height = "auto";
        sc.style.transform = "";
        screen.style.height = `${Math.ceil(pg.offsetHeight * s)}px`;
      }
    };

    const follow = () => {
      if (!wideQ.matches) {
        if (last) setFocus((last = null));
        return;
      }
      const mid = innerHeight * 0.5;
      let part: Part = "head";
      for (const r of rows) if (r.getBoundingClientRect().top <= mid) part = r.dataset.row as Part;
      if (part !== last) setFocus((last = part));
      const target = sc.querySelector<HTMLElement>(`[data-part="${part}"]`);
      const viewH = screen.clientHeight / scale.current;
      const max = Math.max(0, sc.offsetHeight - viewH);
      let off = part === "head" || !target ? 0 : target.offsetTop - 118;
      // an open list: bring it into view, keeping as much of the cards above it as fits
      const list = part === "disc" ? sc.querySelector<HTMLElement>(".pp-list") : null;
      if (list) off = Math.max(off, list.offsetTop + list.offsetHeight + 24 - viewH);
      off = Math.min(max, Math.max(0, off));
      sc.style.transform = `translateY(${-off}px)`;
    };
    sync.current = () => {
      fit();
      follow();
    };

    let queued = false;
    const req = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        follow();
      });
    };
    const ro = new ResizeObserver(() => sync.current());
    ro.observe(screen);
    ro.observe(sc);
    addEventListener("scroll", req, { passive: true });
    wideQ.addEventListener("change", sync.current);
    sync.current();
    return () => {
      ro.disconnect();
      removeEventListener("scroll", req);
      wideQ.removeEventListener("change", sync.current);
    };
  }, []);

  // a list opening changes the page's height
  useEffect(() => sync.current(), [open, whole]);

  return (
    <section className="ps" id="shows" aria-labelledby="h-shows" ref={root}>
      <div className="wrap">
        <div className="ps-head">
          <h2 id="h-shows" className="rv">
            Every plate opens a page for the exact spot you&rsquo;re standing on.
          </h2>
          <p className="rv">
            Distances are measured from the post itself, not from the nearest town. This is the real page for the post at
            Broadway Tower: tap the cards to see what&rsquo;s near.
          </p>
        </div>

        <div className="ps-stage">
          <div className="ps-rows">
            <div className="ps-row" data-row="disc">
              <div className="ps-say">
                <h3>Where&rsquo;s the nearest water, food and toilet?</h3>
                <p>
                  The closest tap, café, shop and toilets, how far each is from the post, opening hours, and walking
                  directions in one tap. The page checks the weather too, and puts what you&rsquo;ll want first.
                </p>
                <div className="ps-wx" role="group" aria-label="Try the weather at the post">
                  <span className="ps-try" aria-hidden="true">
                    Try the weather:
                  </span>
                  {WEATHER_ORDERS.map((w) => (
                    <button key={w.id} type="button" aria-pressed={w.id === wx} onClick={() => pick(w.id)}>
                      {w.label}
                    </button>
                  ))}
                </div>
                <p className="vh" aria-live="polite">
                  {weather.label}: {weather.say} {discovery.map((d) => d.ask).join(", ")}
                </p>
              </div>
              <div className="ps-ui">
                <div className="mp-disc-h">
                  <p className="mp-h">Discovery</p>
                  <span>
                    <Icon i="cloud" size={12} fill="none" />
                    {weather.chip}
                  </span>
                </div>
                <div className="mp-grid">
                  {discovery.map((d) => (
                    <div key={d.icon} ref={(el) => cardRef("flat")(d.icon, el)} style={{ borderLeftColor: d.tint }}>
                      <span className="mp-ic" style={{ background: d.bg, color: d.ink }}>
                        <Icon i={d.icon} size={18} />
                      </span>
                      <b>{d.ask}</b>
                      <span className="mp-what">{d.what}</span>
                      <span className="mp-dist">
                        <Icon i="near" size={13} fill="none" />
                        {d.dist}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mp-wc">
                  <Icon i="wc" size={20} />
                  <span>
                    <b>{DEMO_PAGE.toilets.name}</b>
                    <small>{DEMO_PAGE.toilets.hours}</small>
                  </span>
                  <span className="mp-dist">
                    <Icon i="near" size={13} fill="none" />
                    {DEMO_PAGE.toilets.dist}
                  </span>
                </div>
                {pass && <span className={`pp-wx pp-wx-${pass.id}`} key={pass.key} aria-hidden="true" />}
              </div>
            </div>

            <div className="ps-row" data-row="next">
              <div className="ps-say">
                <h3>How far to the next village, and is it downhill?</h3>
                <p>
                  The next posts along the Way, with the distance, the walking time and the height you&rsquo;ll gain or
                  lose. Enough to decide whether to push on or stop for lunch.
                </p>
              </div>
              <div className="ps-ui">
                <div className="mp-next">
                  <p className="mp-h">
                    <Icon i="route" />
                    What&rsquo;s Next
                  </p>
                  <ol>
                    {DEMO_PAGE.next.map((n) => (
                      <li key={n.name} className={"here" in n ? "here" : undefined}>
                        <b>{n.name}</b>
                        {"here" in n ? (
                          <span>{n.detail}</span>
                        ) : (
                          <span>
                            {n.mi} <em>{n.time}</em> <i>{n.drop}</i>
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="ps-row" data-row="look">
              <div className="ps-say">
                <h3>What should I look out for here?</h3>
                <p>
                  What&rsquo;s worth seeing from this spot and when, from red kites on the thermals to frost at dawn.
                  What is in season now comes first.
                </p>
              </div>
              <div className="ps-ui">
                <div className="mp-look">
                  <p className="mp-h">
                    <Icon i="leaf" />
                    Look Out For
                  </p>
                  <ul>
                    {look.map((n) => (
                      <li key={n.text} className={n.now ? "now" : undefined}>
                        <Icon i={n.icon as IconName} size={20} fill="none" />
                        <span>
                          <b>{n.text}</b>
                          <small>{n.now ? `Active now · ${n.months}` : n.months}</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="ps-row" data-row="story">
              <div className="ps-say">
                <h3>And what happened here?</h3>
                <p>
                  Every post has its own story, checked against published sources. Walk the first stretch below for a
                  taste of each one.
                </p>
                <a className="ps-down" href="#walk">
                  Walk the first stretch <Arrow down />
                </a>
              </div>
            </div>

            <ul className="ps-also" data-row="more" aria-label="Also on every page">
              <li>
                <Icon i="flag" size={20} fill="none" />
                <span>
                  <b>Notes from other walkers</b> about the path at that post: mud, a fallen tree, cattle in the field.
                </span>
              </li>
              <li>
                <Icon i="camera" size={20} fill="none" />
                <span>
                  <b>Can&rsquo;t spot the plate?</b> A photo of the post and tips from walkers who found it.
                </span>
              </li>
              <li>
                <Icon i="phone" size={20} fill="none" />
                <span>
                  <b>It opens in your phone&rsquo;s browser.</b> Nothing to install, no account, free.
                </span>
              </li>
            </ul>

            <button
              type="button"
              className="btn btn-ghost ps-whole"
              aria-expanded={whole}
              aria-controls="ps-phone"
              onClick={() => setWhole((w) => !w)}
            >
              {whole ? "Hide the whole page" : "See the whole page, top to bottom"}
              {!whole && <Arrow down />}
            </button>
          </div>

          <div className={`ps-phone-col${whole ? " shown" : ""}`} id="ps-phone">
            <div className="ps-phone rv">
              <PlatePhone
                order={weather.order}
                chip={weather.chip}
                open={open}
                onOpen={setOpen}
                focus={focus}
                weather={pass}
                look={look}
                fullStory={fullStory}
                pageRef={page}
                scrollRef={scroller}
                cardRef={phoneCard}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
