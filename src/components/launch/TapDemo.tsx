"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import Image from "next/image";
import { DEMO_PHOTO } from "@/content/launch";
import { useLive } from "./LiveLine";

const j = (n: number) => ({ "--j": n }) as CSSProperties;

/**
 * "Tap the plate": the phone moves to the plate, rings ripple out and a
 * sample marker page slides up, laid out like the working prototype.
 */
export default function TapDemo({ day }: { day?: string }) {
  const [on, setOn] = useState(false);
  const [tapping, setTapping] = useState(false);
  const timers = useRef<number[]>([]);
  const live = useLive(day);

  function tap() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (on) {
      setOn(false);
      return;
    }
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // restart the touch animation even if it's mid-way
    setTapping(false);
    requestAnimationFrame(() => setTapping(true));
    timers.current.push(
      window.setTimeout(() => setOn(true), RM ? 0 : 520),
      window.setTimeout(() => setTapping(false), 1400),
    );
  }

  return (
    <div>
      <div className={`demo${on ? " on" : ""}${tapping ? " tapping" : ""}`}>
        <div className="postm">
          <span className="wood" aria-hidden="true" />
          <span className="disc" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 26 26">
              <path d="M4 13h13M12 6l7 7-7 7" fill="none" stroke="#e0b100" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <button className="plateb" type="button" onClick={tap} aria-label="Try it: tap the plate">
            <Image src="/launch/plate.svg" alt="" width={104} height={144} unoptimized />
          </button>
          <span className="nfc idle" aria-hidden="true" />
          <span className="nfc" aria-hidden="true" />
          <span className="nfc" aria-hidden="true" />
        </div>
        <div className="phone">
          <div className="screen">
            <div className="lock" aria-hidden={on}>
              <b>{live?.clock ?? "09:41"}</b>
              <span>
                Hold your phone to the plate,
                <br />
                or point the camera at the code
              </span>
            </div>
            <div className="mpage" aria-hidden={!on} role="group" aria-label="A sample marker page">
              <div className="mphoto">
                <Image src={DEMO_PHOTO.src} alt="Broadway Tower" fill sizes="232px" />
              </div>
              <div className="s">
                <div className="e">You are here · Mile 4.4 · 302 m</div>
                <h3>Broadway Tower</h3>
                <div className="aud">
                  <i>
                    <svg width="10" height="12" viewBox="0 0 14 16" aria-hidden="true">
                      <path d="M1 1l12 7-12 7z" fill="#fff" />
                    </svg>
                  </i>
                  <span>
                    <b>The story of this spot</b>
                    <span>Listen · about 3 min</span>
                  </span>
                  <span className="wave" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <u key={n} style={j(n)} />
                    ))}
                  </span>
                </div>
                <div className="chips">
                  <span style={j(0)}>Water · here</span>
                  <span style={j(1)}>Café 0.1 mi</span>
                  <span style={j(2)}>Toilets 0.2 mi</span>
                </div>
                <div className="nx">
                  <b>Next: Broadway village</b>1.5 mi · about 40 min · 200 m downhill
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="demo-cta">
        <button className="btn btn-ghost" type="button" onClick={tap}>
          {on ? "Put the phone away" : "Tap the plate"}
        </button>
      </div>
      <p className="caption">A marker page, laid out as in the working prototype</p>
      <p className="vh" aria-live="polite">
        {on ? "The sample marker page for Broadway Tower is showing on the phone." : ""}
      </p>
    </div>
  );
}
