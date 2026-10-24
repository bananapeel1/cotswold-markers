"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLaunchPath } from "@/lib/launch/paths";
import { ICON_FONT_FULL, ICON_FONT_SUBSET, ICON_NAMES } from "@/lib/iconFont";

const KNOWN = new Set<string>(ICON_NAMES);

/** True when the page shows an icon the cut-down font doesn't have. */
const needsFull = () =>
  [...document.querySelectorAll(".material-symbols-outlined")].some((el) => {
    const name = el.textContent?.trim();
    return !!name && !KNOWN.has(name);
  });

/**
 * The app's icon font, cut down to the icons the code uses. If a page shows
 * any other icon (one typed into /admin, say), the full font loads as well
 * and, defined last, takes over. The launch site draws its own icons, so it
 * never waits for either.
 */
export default function IconFont() {
  const pathname = usePathname();
  const launch = isLaunchPath(pathname);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (launch || full) return;
    let t = 0;
    const check = () => {
      clearTimeout(t);
      t = window.setTimeout(() => needsFull() && setFull(true), 250);
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      clearTimeout(t);
      mo.disconnect();
    };
  }, [launch, full]);

  if (launch) return null;
  return (
    <>
      <link rel="stylesheet" href={ICON_FONT_SUBSET} precedence="default" />
      {full && <link rel="stylesheet" href={ICON_FONT_FULL} precedence="default" />}
    </>
  );
}
