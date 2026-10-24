"use client";

import { usePathname } from "next/navigation";
import { isLaunchPath } from "@/lib/launch/paths";

/**
 * The app's icon font (about 1.1 MB, and render-blocking). The launch site
 * draws its own icons, so it never waits for it.
 */
export default function IconFont() {
  const pathname = usePathname();
  if (isLaunchPath(pathname)) return null;
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      precedence="default"
    />
  );
}
