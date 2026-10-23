import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { FIRST_STRETCH_KM, QUESTIONS, type Moment } from "@/content/launch";
import {
  ELEV,
  QUESTION_STOPS,
  STRIP_PLACES,
  STRIP_VARIANTS,
  bigClimbs,
  eleAt,
  mi,
  pathD,
  placeNote,
  stripLayout,
  type StripLayout,
  type StripVariant,
} from "@/lib/launch/geo";

const v = (vars: Record<string, string>) => vars as CSSProperties;
const layouts = Object.fromEntries(STRIP_VARIANTS.map((k) => [k, stripLayout(k)])) as Record<
  StripVariant,
  StripLayout
>;

/** A CSS variable per layout, so one set of cards follows whichever map is showing. */
function perLayout(name: string, f: (L: StripLayout) => number) {
  return Object.fromEntries(STRIP_VARIANTS.map((k) => [`--${name}-${k}`, `${f(layouts[k]).toFixed(1)}px`]));
}

function StripSvg({ L }: { L: StripLayout }) {
  const narrow = L.variant === "narrow";
  const { W, total, rail, X, yOfKm, path, routeLen, room, gap } = L;
  const out: ReactNode[] = [];

  // a line every mile
  for (let m = 0; m <= 22; m++) {
    const km = m / 0.621371;
    if (km > FIRST_STRETCH_KM) break;
    const yy = yOfKm(km);
    out.push(
      <g key={`m${m}`}>
        <line x1={rail - 6} y1={yy} x2={W} y2={yy} stroke="#1d3024" strokeOpacity={m % 5 === 0 ? 0.16 : 0.07} />
        <text
          x={rail - 10}
          y={yy + 4}
          textAnchor="end"
          fontSize={narrow ? 10 : 11}
          fontWeight={700}
          className="bodyfont tnum"
          fill="#4f5b51"
        >
          {m === 0 ? (narrow ? "0" : "0 mi") : m}
        </text>
      </g>,
    );
  }

  // contours: one more ring around the path for every 30 m of height, like the logo's rings
  for (let k = 1; k <= 7; k++) {
    const th = 90 + k * 30;
    for (const side of [-1, 1]) {
      let d = "";
      let on = false;
      for (let i = 0; i <= FIRST_STRETCH_KM * 10; i++) {
        const km = i / 10;
        if (eleAt(km) > th) {
          const xx = X(km) + side * (8 + k * gap) + side * Math.sin(km * 1.7 + k) * 2;
          d += (on ? "L" : "M") + xx.toFixed(1) + " " + yOfKm(km).toFixed(1) + " ";
          on = true;
        } else on = false;
      }
      if (d)
        out.push(
          <path
            key={`c${k}${side}`}
            d={d}
            fill="none"
            stroke="#a8875a"
            strokeWidth={k % 5 === 0 ? 1.3 : 0.9}
            strokeOpacity={k % 5 === 0 ? 0.75 : 0.5}
            strokeLinejoin="round"
          />,
        );
    }
  }
  if (!narrow)
    out.push(
      <text key="ct" x={W - 4} y={74} textAnchor="end" fontSize={10} fontStyle="italic" className="mapfont" fill="#8a6b42">
        contours every 30 m
      </text>,
    );

  // hachures where the ground is steep
  for (let i = 1; i < ELEV.length; i++) {
    const [ak, ae] = ELEV[i - 1];
    const [bk, be] = ELEV[i];
    const g = (be - ae) / ((bk - ak) * 1000);
    if (Math.abs(g) <= 0.05) continue;
    for (let k = 0; k < 3; k++) {
      const km = ak + ((bk - ak) * k) / 3;
      const yy = yOfKm(km);
      const xx = X(km);
      const len = Math.min(16, 6 + Math.abs(g) * 80) * (narrow ? 0.7 : 1);
      const dy = g > 0 ? -3 : 3;
      out.push(
        <g key={`h${i}-${k}`} stroke="#a8875a" strokeWidth={1.1} strokeOpacity={0.75}>
          <line x1={xx - 7} y1={yy} x2={xx - 7 - len} y2={yy + dy} />
          <line x1={xx + 7} y1={yy} x2={xx + 7 + len} y2={yy + dy} />
        </g>,
      );
    }
  }

  if (!narrow)
    for (const c of bigClimbs()) {
      const yy = (yOfKm(c.km) + yOfKm(c.km + 1.2)) / 2;
      out.push(
        <text key={`cl${c.km}`} x={W - 4} y={yy} textAnchor="end" fontSize={11} fontStyle="italic" className="mapfont" fill="#8a6b42">
          {(c.d > 0 ? "climb " : "descent ") + Math.abs(Math.round(c.d)) + " m"}
        </text>,
      );
    }

  const d = pathD(path);
  const maskId = `walked-${L.variant}`;
  const yEnd = yOfKm(FIRST_STRETCH_KM);
  const xEnd = X(FIRST_STRETCH_KM);
  const sy = yOfKm(0);
  const sx = X(0);

  return (
    <svg
      className={`map map-${L.variant}`}
      data-variant={L.variant}
      viewBox={`0 0 ${W} ${total}`}
      style={{ height: total }}
      aria-hidden="true"
    >
      {out}
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={total}>
          {/* drawn in behind the walker by LaunchMotion; with no scripts the whole path shows */}
          <path
            className="walkpath"
            d={d}
            fill="none"
            stroke="#fff"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${routeLen.toFixed(1)} ${routeLen.toFixed(1)}`}
            strokeDashoffset={0}
          />
        </mask>
      </defs>
      <path d={d} fill="none" stroke="#f8f4ea" strokeWidth={9} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#9a3412" strokeWidth={3.2} strokeDasharray="7 5" strokeLinecap="round" strokeOpacity={0.3} />
      <path d={d} fill="none" stroke="#9a3412" strokeWidth={3.6} strokeDasharray="7 5" strokeLinecap="round" mask={`url(#${maskId})`} />
      <path d={`M${xEnd} ${yEnd} L${xEnd} ${yEnd + 34}`} stroke="#8d8a7e" strokeWidth={3} strokeDasharray="2 6" strokeLinecap="round" />

      {STRIP_PLACES.map((p) => {
        const yy = yOfKm(p.km);
        const xx = X(p.km);
        const town = p.kind === "settlement";
        return (
          <g key={p.name} className="place-g" data-km={p.km}>
            {town ? (
              [0, 1, 2, 3].map((k) => (
                <rect
                  key={k}
                  x={xx - 12 + k * 6}
                  y={yy - 5 - (k % 2) * 3}
                  width={5}
                  height={5 + (k % 2) * 3}
                  fill="#1d3024"
                  fillOpacity={0.72}
                />
              ))
            ) : (
              <circle cx={xx} cy={yy} r={4.5} fill="#f8f4ea" stroke="#1d3024" strokeWidth={1.6} />
            )}
            {!narrow && (
              <text
                x={xx + 18}
                y={yy + 4}
                fontSize={town ? 12 : 13}
                className={town ? "displayfont" : "mapfont"}
                fontStyle={town ? "normal" : "italic"}
                fontWeight={town ? 800 : 400}
                letterSpacing={town ? ".08em" : "0"}
                fill="#1d3024"
              >
                {town ? p.name.toUpperCase() : p.name}
              </text>
            )}
          </g>
        );
      })}

      <circle cx={sx} cy={sy} r={7} fill="#154212" />
      <circle cx={sx} cy={sy} r={2.6} fill="#f3eee2" />
      <text
        x={sx + (narrow ? 10 : 18)}
        y={sy - 14}
        fontSize={narrow ? 9 : 11}
        fontWeight={700}
        className="bodyfont"
        fill="#9a3412"
        letterSpacing=".1em"
      >
        START HERE
      </text>
      <g transform={`translate(${W - 18} 24) rotate(-50)`}>
        <path d="M0 -12 L5 5 L0 2 L-5 5Z" fill="#1d3024" />
      </g>
      <text x={W - 18} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="bodyfont" fill="#1d3024">
        N
      </text>

      {QUESTION_STOPS.map((q) => {
        const yy = yOfKm(q.km) - room + 26;
        const xx = X(q.km);
        return (
          <g key={q.where}>
            <rect x={xx - 9} y={yy - 11} width={18} height={20} rx={5} fill="#f3eee2" stroke="#9a3412" strokeWidth={1.6} />
            <text x={xx} y={yy + 4} textAnchor="middle" fontSize={13} fontStyle="italic" className="mapfont" fill="#9a3412">
              ?
            </text>
          </g>
        );
      })}

      {/* the walker: parked out of sight until LaunchMotion moves it */}
      <g className="walker" transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}>
        <circle r={9} fill="none" stroke="#9a3412" strokeWidth={2} className="halo" />
        <circle r={7.5} fill="#9a3412" stroke="#f8f4ea" strokeWidth={2.5} />
      </g>
    </svg>
  );
}

export default function StripMap({ moment, answer }: { moment: Moment; answer: string }) {
  const startEle = Math.round(eleAt(0));
  const yEndNote = perLayout("top", (L) => L.yOfKm(FIRST_STRETCH_KM) - 10);

  return (
    <div className="strip" id="strip" data-moment={moment} style={v(perLayout("h", (L) => L.total))}>
      <div className="readout" id="readout" aria-hidden="true">
        <span>Mile</span>
        <b id="ro-mi">0.0</b>
        <span className="ro-h" id="ro-h">
          {startEle} m up
        </span>
        <span className="ro-p" id="ro-p">
          Chipping Campden
        </span>
      </div>
      <div className="maps">
        {STRIP_VARIANTS.map((k) => (
          <StripSvg key={k} L={layouts[k]} />
        ))}
      </div>
      <div className="cards" id="cards">
        {QUESTION_STOPS.map((q) => (
          <article
            key={q.where}
            className="card rv r"
            style={v(perLayout("top", (L) => L.yOfKm(q.km) - L.room + (L.variant === "narrow" ? 4 : 8)))}
          >
            <div className="txt">
              <span className="place">
                {q.where} · mile {mi(q.km).toFixed(1)} · {Math.round(eleAt(q.km))} m up
              </span>
              <h3>{q.question}</h3>
              <span className="ans">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                    fill="#9a3412"
                  />
                </svg>
                {answer}
              </span>
            </div>
            <figure>
              <Image src={q.photo} alt={q.alt} fill sizes="(max-width: 620px) 90vw, 176px" />
              <span className="q" aria-hidden="true">
                ?
              </span>
              <figcaption>{q.credit}</figcaption>
            </figure>
          </article>
        ))}

        {/* trail notes at each place, where no card is in the way */}
        {STRIP_PLACES.map((p) => {
          const hidden = STRIP_VARIANTS.filter((k) => {
            const L = layouts[k];
            const yy = L.yOfKm(p.km);
            return QUESTIONS.some((q) => {
              const a = L.yOfKm(q.km) - L.room;
              const b = L.yOfKm(q.km);
              return yy > a - 40 && yy < b + (k === "narrow" ? 90 : 70);
            });
          });
          if (hidden.length === STRIP_VARIANTS.length) return null;
          return (
            <p
              key={p.name}
              className={`pnote rv ${hidden.map((k) => `hide-${k}`).join(" ")}`}
              style={v(perLayout("top", (L) => L.yOfKm(p.km) - 14))}
            >
              <b>{p.name}</b>
              <span>
                mile {mi(p.km).toFixed(1)} · {p.ele} m
              </span>
              {placeNote(p)}
            </p>
          );
        })}
        <p className="pnote rv" style={v(yEndNote)}>
          <b>Cleeve Hill</b>
          <span>mile 22 · end of the first stretch</span>
          The highest ground on the whole Cotswold Way is just above you. The trail carries on south
          {moment === "whole" ? ", with markers all the way to Bath." : "; its markers follow in June."}
        </p>
      </div>
    </div>
  );
}
