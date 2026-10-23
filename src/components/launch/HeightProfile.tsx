import type { CSSProperties } from "react";
import type { Moment } from "@/content/launch";
import { PROFILE_FROM_KM, PROFILE_TOWNS, pathD, profileGeometry } from "@/lib/launch/geo";

const v = (vars: Record<string, string | number>) => vars as CSSProperties;
const H = 280;

/**
 * Chapter two: Cleeve Hill to Bath, side on. The line is an SVG stretched to
 * the container's width; the dots and town names are HTML placed by
 * percentage, so the lettering stays the same size on every screen.
 */
export default function HeightProfile({ moment }: { moment: Moment }) {
  const { line, base, xs, ys, eleNear, startEle } = profileGeometry(H);
  const whole = moment === "whole";
  const d = pathD(line);
  const last = line[line.length - 1];
  const narrowTowns = PROFILE_TOWNS.filter((t) => t.narrow);
  const pct = (y: number) => `${((y / H) * 100).toFixed(2)}%`;

  return (
    <div className="prof rv" id="prof">
      <p className="prof-cap">
        Cleeve Hill, {startEle} m · the next 80 miles side on, heights exaggerated
      </p>
      <div className="prof-plot" style={v({ "--b": pct(base) })}>
        <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={`${d} L${last[0]} ${base} L${line[0][0]} ${base} Z`} fill="#e6dcc6" className="area" />
          <line x1={0} x2={1000} y1={base} y2={base} stroke="#1d3024" strokeOpacity={0.25} vectorEffect="non-scaling-stroke" />
          <path
            d={d}
            className="line"
            fill="none"
            stroke={whole ? "#9a3412" : "#6f6c62"}
            strokeWidth={whole ? 3.4 : 2.4}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <ol className="towns" aria-label="Towns and hills from Cleeve Hill to Bath">
          {PROFILE_TOWNS.map((t, i) => {
            const n = narrowTowns.indexOf(t);
            return (
              <li
                key={t.name}
                className={`tick${t.narrow ? "" : " wide-only"}${t.km === 165 ? " end" : ""}`}
                style={v({
                  "--x": `${(xs(t.km) / 10).toFixed(2)}%`,
                  "--y": pct(ys(eleNear(t.km))),
                  "--row-w": i % 2,
                  "--row-n": Math.max(0, n) % 2,
                  "--dl": `${(0.4 + ((t.km - PROFILE_FROM_KM) / (165 - PROFILE_FROM_KM)) * 2.4).toFixed(2)}s`,
                })}
              >
                <span className="stem" aria-hidden="true" />
                <span className="dot" aria-hidden="true" />
                <span className="name">{t.name}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="stamp" aria-hidden="true">
        {whole ? "Open" : "June 2027"}
        <small>The whole Way</small>
      </div>
    </div>
  );
}
