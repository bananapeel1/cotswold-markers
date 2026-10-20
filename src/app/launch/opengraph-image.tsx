import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Link preview for Instagram, Facebook and WhatsApp shares (built once at build time)
export const alt =
  "TrailTap: the first 20 markers, on the north end of the Cotswold Way. Open to everyone from Monday 15 March 2027.";
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#fcf9f2",
          color: "#154212",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logoSrc} width={56} height={56} alt="" />
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>TrailTap</div>
          <div style={{ fontSize: 26, fontWeight: 500, color: "#42493e", marginLeft: 8 }}>
            Cotswold Way
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
            The first 20 markers, on the north end of the Cotswold Way.
          </div>
          <div style={{ fontSize: 36, fontWeight: 500, color: "#1c1c18" }}>
            Open to everyone from Monday 15 March 2027.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: "#154212",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>trailtap.uk/launch</div>
        </div>
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
