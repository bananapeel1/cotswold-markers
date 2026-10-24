"use client";

import type { Ref } from "react";
import { DEMO_PAGE, DEMO_PHOTO, DEMO_PLACES, QUESTIONS } from "@/content/launch";
import { Icon, type IconName } from "./mpIcons";

/**
 * The whole Broadway Tower page in a phone, drawn at the app's 390 px width
 * and scaled to the frame. PlateShows scrolls it, lights up the part being
 * talked about, and passes the weather; the Discovery cards open their lists
 * the way the real page does.
 */

export type Part = "head" | "next" | "disc" | "look" | "story" | "more";
export type Place = keyof typeof DEMO_PLACES;

const STORY = QUESTIONS.find((q) => q.where === "Broadway Tower")!;
const directions = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

/** The places behind a Discovery card, as the real page lists them when it's tapped. */
export function PlaceList({ open, onOpen }: { open: Place | null; onOpen: (p: Place | null) => void }) {
  if (!open) return null;
  const title = open === "wc" ? "Toilets" : DEMO_PAGE.discovery.find((d) => d.icon === open)?.ask;
  return (
    <div className="pp-list" key={open}>
      <div className="pp-list-h">
        <p>{title}</p>
        <button type="button" aria-label="Close the list" onClick={() => onOpen(null)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {DEMO_PLACES[open].map((p) => (
        <div className="pp-place" key={p.name}>
          <p className="pp-place-h">
            <b>{p.name}</b>
            <span className="pp-tag">{p.type}</span>
            <span className="pp-d">{p.dist}</span>
          </p>
          <p className="pp-place-f">
            <small>{p.hours}</small>
            <a href={directions(p.lat, p.lng)} target="_blank" rel="noopener noreferrer">
              Directions
            </a>
          </p>
        </div>
      ))}
    </div>
  );
}

export default function PlatePhone({
  order,
  chip,
  open,
  onOpen,
  focus,
  weather,
  look,
  fullStory,
  pageRef,
  scrollRef,
  cardRef,
}: {
  order: readonly string[];
  chip: string;
  open: Place | null;
  onOpen: (p: Place | null) => void;
  focus: Part | null;
  /** which weather passes over the screen; the key restarts it */
  weather: { id: string; key: number } | null;
  look: readonly { icon: string; text: string; months: string; now: boolean }[];
  fullStory: string;
  pageRef: Ref<HTMLDivElement>;
  scrollRef: Ref<HTMLDivElement>;
  cardRef: (key: string, el: HTMLElement | null) => void;
}) {
  const discovery = order.map((k) => DEMO_PAGE.discovery.find((d) => d.icon === k)!);
  const lit = (p: Part) => (focus === p ? "lit" : undefined);

  return (
    <div className="pp-device">
      <div className="pp-screen">
        <span className="pp-island" aria-hidden="true" />
        <div className="pp-page" ref={pageRef} data-focus={focus && focus !== "head" ? focus : undefined}>
          <div className="mp-status" aria-hidden="true">
            <b>09:41</b>
            <span>
              <svg width="18" height="11" viewBox="0 0 18 11">
                <rect x="0" y="7" width="3" height="4" rx="1" />
                <rect x="5" y="5" width="3" height="6" rx="1" />
                <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
                <rect x="15" y="0" width="3" height="11" rx="1" />
              </svg>
              <svg width="26" height="12" viewBox="0 0 26 12">
                <rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" />
                <rect x="2" y="2" width="15" height="8" rx="2" />
                <rect x="23.5" y="4" width="2" height="4" rx="1" opacity=".4" />
              </svg>
            </span>
          </div>
          <div className="mp-nav" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" width={32} height={32} />
            <b>TrailTap</b>
            <svg className="mp-menu" width="24" height="24" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="pp-scroll" ref={scrollRef}>
            <section className={lit("head")} data-part="head">
              <div className="mp-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mp-photo" src={DEMO_PHOTO.src} alt="" width={358} height={201} decoding="async" loading="lazy" />
                <p className="mp-loc">
                  <Icon i="pin" size={18} />
                  Current location
                </p>
                <p className="pp-name">{DEMO_PAGE.name}</p>
              </div>
            </section>

            <section className={lit("next")} data-part="next">
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
            </section>

            <section className={lit("disc")} data-part="disc">
              <div className="mp-disc">
                <div className="mp-disc-h">
                  <p className="mp-h">Discovery</p>
                  <span>
                    <Icon i="cloud" size={12} fill="none" />
                    {chip}
                  </span>
                </div>
                <div className="mp-grid">
                  {discovery.map((d) => (
                    <button
                      key={d.icon}
                      type="button"
                      ref={(el) => cardRef(d.icon, el)}
                      style={{ borderLeftColor: d.tint }}
                      aria-expanded={open === d.icon}
                      onClick={() => onOpen(open === d.icon ? null : d.icon)}
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
                    </button>
                  ))}
                </div>
                <button type="button" className="mp-wc" aria-expanded={open === "wc"} onClick={() => onOpen(open === "wc" ? null : "wc")}>
                  <Icon i="wc" size={20} />
                  <span>
                    <b>{DEMO_PAGE.toilets.name}</b>
                    <small>{DEMO_PAGE.toilets.hours}</small>
                  </span>
                  <span className="mp-dist">
                    <Icon i="near" size={13} fill="none" />
                    {DEMO_PAGE.toilets.dist}
                  </span>
                </button>
                <PlaceList open={open} onOpen={onOpen} />
              </div>
            </section>

            <section className={lit("look")} data-part="look">
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
            </section>

            <section className={lit("story")} data-part="story">
              <div className="pp-story">
                <p className="mp-h">Stories</p>
                <p className="pp-q">{STORY.question}</p>
                <p className="pp-a">{STORY.answer}</p>
                <p className="pp-at">{fullStory}</p>
              </div>
            </section>

            <section className={lit("more")} data-part="more">
              <div className="pp-more">
                <p>
                  <b>Trail Conditions</b> <span>· All clear</span>
                </p>
                <p>
                  <Icon i="camera" size={16} fill="none" />
                  Can&rsquo;t find this marker?
                </p>
              </div>
            </section>
          </div>

          <span className="mp-fab mp-fab-a" aria-hidden="true">
            <Icon i="person" size={22} fill="none" />
          </span>
          <span className="mp-fab mp-fab-b" aria-hidden="true">
            <Icon i="map" size={22} fill="none" />
          </span>
        </div>
        {weather && <span className={`pp-wx pp-wx-${weather.id}`} key={weather.key} aria-hidden="true" />}
      </div>
    </div>
  );
}
