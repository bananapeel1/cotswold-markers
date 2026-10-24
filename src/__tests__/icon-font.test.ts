import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ICON_FONT_SUBSET, ICON_NAMES } from "@/lib/iconFont";

const SRC = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === "__tests__" ? [] : files(p);
    return /\.tsx?$/.test(f) ? [p] : [];
  });
}

/** Icon names written straight into the code: as a span's text, or as an `icon: "…"` value. */
function iconsInCode(): Map<string, string> {
  const found = new Map<string, string>();
  for (const p of files(SRC)) {
    const s = readFileSync(p, "utf8");
    if (!s.includes("material-symbols")) continue;
    for (const m of s.matchAll(/material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]*)\s*</g)) found.set(m[1], p);
    for (const m of s.matchAll(/\b[a-zA-Z]*[iI]con\s*[:=]\s*["']([a-z][a-z0-9_]*)["']/g)) found.set(m[1], p);
  }
  return found;
}

describe("cut-down icon font", () => {
  it("has every icon the code names", () => {
    const known = new Set<string>(ICON_NAMES);
    const missing = [...iconsInCode()].filter(([n]) => !known.has(n)).map(([n, p]) => `${n} (${p.replace(SRC, "src")})`);
    expect(missing).toEqual([]);
  });

  it("asks Google for the names in alphabetical order", () => {
    const names = new URL(ICON_FONT_SUBSET).searchParams.get("icon_names")!.split(",");
    expect(names).toEqual([...names].sort());
    expect(names.length).toBe(new Set(names).size);
  });
});
