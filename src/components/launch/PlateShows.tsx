"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DEMO_PAGE, DEMO_PAGE_URL, WEATHER_ORDERS } from "@/content/launch";
import { Icon, type IconName } from "./mpIcons";
import Arrow from "./Arrow";

/**
 * What a plate's page is for, shown with the real Broadway Tower page: the
 * nearest water, food and toilets (reordered by the weather, as the page
 * does), the way ahead, and what to look out for. The stories have the walk
 * below to themselves.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct-Feb" or "Year-round", as the real page reads them. */
function inSeason(months: string, month: number): boolean {
  if (months === "Year-round") return true;
  const [a, b] = months.split("-").map((m) => MONTHS.indexOf(m) + 1);
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}

type Weather = (typeof WEATHER_ORDERS)[number]["id"];

export default function PlateShows({ day }: { day: string }) {
  const [wx, setWx] = useState<Weather>("rain");
  const cards = useRef(new Map<string, HTMLElement>());
  const before = useRef<Map<string, DOMRect> | null>(null);
  const weather = WEATHER_ORDERS.find((w) => w.id === wx)!;
  const discovery = weather.order.map((k) => DEMO_PAGE.discovery.find((d) => d.icon === k)!);
  const month = Number(day.slice(5, 7));
  const look = [...DEMO_PAGE.look].sort((a, b) => Number(inSeason(b.months, month)) - Number(inSeason(a.months, month)));

  const pick = (id: Weather) => {
    if (id === wx) return;
    before.current = new Map([...cards.current].map(([k, el]) => [k, el.getBoundingClientRect()]));
    setWx(id);
  };

  // the cards glide to their new places rather than jumping
  useLayoutEffect(() => {
    const first = before.current;
    before.current = null;
    if (!first || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const [k, el] of cards.current) {
      const a = first.get(k);
      if (!a) continue;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (dx || dy)
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 520,
          easing: "cubic-bezier(.2,.7,.2,1)",
        });
    }
  }, [wx]);

  return (
    <section className="ps" id="shows" aria-labelledby="h-shows">
      <div className="wrap">
        <div className="ps-head">
          <h2 id="h-shows" className="rv">
            Every plate opens a page for the exact spot you&rsquo;re standing on.
          </h2>
          <p className="rv">
            Distances are measured from the post itself, not from the nearest town. This is the real page for the post at
            Broadway Tower, and you can open it now.
          </p>
          <a className="btn btn-ghost rv" href={DEMO_PAGE_URL}>
            Open the Broadway Tower page <Arrow />
          </a>
        </div>

        <div className="ps-row">
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
                <div
                  key={d.icon}
                  ref={(el) => {
                    if (el) cards.current.set(d.icon, el);
                    else cards.current.delete(d.icon);
                  }}
                  style={{ borderLeftColor: d.tint }}
                >
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
          </div>
        </div>

        <div className="ps-row">
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

        <div className="ps-row">
          <div className="ps-say">
            <h3>What should I look out for here?</h3>
            <p>
              What&rsquo;s worth seeing from this spot and when, from red kites on the thermals to frost at dawn. What
              is in season now comes first.
            </p>
          </div>
          <div className="ps-ui">
            <div className="mp-look">
              <p className="mp-h">
                <Icon i="leaf" />
                Look Out For
              </p>
              <ul>
                {look.map((n) => {
                  const now = inSeason(n.months, month);
                  return (
                    <li key={n.text} className={now ? "now" : undefined}>
                      <Icon i={n.icon as IconName} size={20} fill="none" />
                      <span>
                        <b>{n.text}</b>
                        <small>{now ? `Active now · ${n.months}` : n.months}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <ul className="ps-also" aria-label="Also on every page">
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
      </div>
    </section>
  );
}
