import type { CSSProperties } from "react";
import { FIRST_STRETCH_KM, type Moment } from "@/content/launch";
import {
  BIG_MAP_TIMING,
  BIG_MAP_TOWNS,
  KEY,
  bigMapDelay,
  bigMapProjection,
  pts,
} from "@/lib/launch/geo";

const v = (vars: Record<string, string>) => vars as CSSProperties;

/**
 * The whole Way from Chipping Campden to Bath. Drawn in full on the server;
 * with scripts on, LaunchMotion adds `.go` and CSS draws it in: the first
 * stretch in rust, the rest in pencil (rust once the whole Way is open).
 */
export default function BigMap({ moment, labelledBy }: { moment: Moment; labelledBy: string }) {
  const { W, H, P, at, after } = bigMapProjection();
  const whole = moment === "whole";
  const all = KEY.map(P);
  const first = KEY.filter((p) => p[2] <= FIRST_STRETCH_KM).map(P);
  const rest = KEY.filter((p) => p[2] >= FIRST_STRETCH_KM - 0.3).map(P);
  const { delay, first: tFirst, rest: tRest } = BIG_MAP_TIMING;

  const tag = (km: number, a: string, b: string, dx: number, fill: string) => {
    const [x, y] = after(km);
    return (
      <g className="pop" style={v({ "--dl": `${bigMapDelay(km) + 0.3}s` })}>
        <text x={x + dx} y={y - 4} fontSize={11} fontStyle="italic" className="mapfont" fill={fill}>
          <tspan x={x + dx} fontWeight={600}>
            {a}
          </tspan>
          <tspan x={x + dx} dy={13}>
            {b}
          </tspan>
        </text>
      </g>
    );
  };

  const [sx, sy] = P(KEY[0]);

  return (
    <svg id="bigmap" className="bigmap" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={labelledBy}>
      {/* escarpment echoes: the Way runs along a west-facing edge, so the rings sit to the west */}
      {[1, 2, 3, 4].map((e) => (
        <polyline
          key={e}
          points={pts(all.map((q) => [q[0] - e * 7, q[1] + e * 1.5]))}
          fill="none"
          stroke="#a8875a"
          strokeOpacity={0.28 - e * 0.05}
          strokeWidth={1}
          className="pop"
          style={v({ "--dl": `${0.2 + e * 0.12}s` })}
        />
      ))}
      <polyline points={pts(all)} fill="none" stroke="#f3eee2" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={pts(rest)}
        pathLength={1}
        className="draw"
        fill="none"
        stroke={whole ? "#9a3412" : "#8d8a7e"}
        strokeWidth={whole ? 3.6 : 2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={v({ "--t": `${tRest}s`, "--dl": `${delay + tFirst}s` })}
      />
      {!whole && (
        // dashes for the part still to come, laid over the drawn line once it's done
        <polyline
          points={pts(rest)}
          fill="none"
          stroke="#f3eee2"
          strokeWidth={3.4}
          strokeDasharray="3 4"
          className="pop"
          style={v({ "--dl": `${delay + tFirst + tRest}s` })}
        />
      )}
      <polyline
        points={pts(first)}
        pathLength={1}
        className="draw glow"
        fill="none"
        stroke="#9a3412"
        strokeWidth={4.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={v({ "--t": `${tFirst}s`, "--dl": `${delay}s` })}
      />
      {BIG_MAP_TOWNS.map(([name, km]) => {
        const [x, y] = at(km);
        const big = km === 0 || km === 165;
        const left = x > W * 0.52 || name === "Winchcombe";
        return (
          <g key={name} className="pop" style={v({ "--dl": `${bigMapDelay(km)}s` })}>
            <circle cx={x} cy={y} r={big ? 4.2 : 3} fill="#1d3024" stroke="#f3eee2" strokeWidth={1.5} />
            <text
              x={x + (left ? -8 : 8)}
              y={y + 4}
              textAnchor={left ? "end" : "start"}
              fontSize={big ? 12 : 10.5}
              fontWeight={big ? 800 : 600}
              className={big ? "displayfont" : "bodyfont"}
              fill="#1d3024"
            >
              {name}
            </text>
          </g>
        );
      })}
      <circle cx={sx} cy={sy} r={6} fill="none" stroke="#9a3412" strokeWidth={2} className="pulse" />
      {tag(20, "20 markers", "from 15 March", 16, "#9a3412")}
      {tag(88, whole ? "All 50" : "30 more", whole ? "open now" : "in June", 14, whole ? "#9a3412" : "#5f5c52")}
      <g transform={`translate(${W - 16} 20)`}>
        <path d="M0 -9 L4 4 L0 1 L-4 4Z" fill="#1d3024" />
        <text x={0} y={15} textAnchor="middle" fontSize={9} fontWeight={700} className="bodyfont" fill="#1d3024">
          N
        </text>
      </g>
    </svg>
  );
}
