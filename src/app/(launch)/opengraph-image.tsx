import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FIRST_STRETCH_KM } from "@/content/launch";
import { KEY, bigMapProjection, pts } from "@/lib/launch/geo";

// Link preview for Instagram, Facebook and WhatsApp shares (built once at build time)
export const alt =
  "TrailTap: the Cotswold Way, told as you walk it. The first stretch opens on 15 March 2027, the whole Way in June.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fonts = join(process.cwd(), "node_modules/@fontsource/inter/files");
  const [extraBold, medium, logo] = await Promise.all([
    readFile(join(fonts, "inter-latin-800-normal.woff")),
    readFile(join(fonts, "inter-latin-500-normal.woff")),
    readFile(join(process.cwd(), "public/images/logo.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  // The whole Way, as on the homepage's map: the first stretch in marker orange
  const { W, H, P } = bigMapProjection();
  const first = pts(KEY.filter((p) => p[2] <= FIRST_STRETCH_KM).map(P));
  const rest = pts(KEY.filter((p) => p[2] >= FIRST_STRETCH_KM - 0.3).map(P));
  const mapH = 560;
  const mapW = Math.round(((W * 0.64) / H) * mapH);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f8f4ea",
          color: "#154212",
          fontFamily: "Inter",
          padding: "56px 0 56px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={logoSrc} width={56} height={56} alt="" />
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>TrailTap</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 700 }}>
              The Cotswold Way, told as you walk it.
            </div>
            <div style={{ fontSize: 32, fontWeight: 500, color: "#1d3024", maxWidth: 680 }}>
              The first stretch opens on 15 March 2027. The whole Way, to Bath, in June.
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#9a3412" }}>trailtap.uk</div>
        </div>
        <svg width={mapW} height={mapH} viewBox={`${W * 0.18} 0 ${W * 0.64} ${H}`} style={{ marginRight: 40 }}>
          <polyline points={rest} fill="none" stroke="#8d8a7e" strokeWidth={3} strokeDasharray="5 5" strokeLinecap="round" />
          <polyline points={first} fill="none" stroke="#9a3412" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: extraBold, weight: 800, style: "normal" },
        { name: "Inter", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
