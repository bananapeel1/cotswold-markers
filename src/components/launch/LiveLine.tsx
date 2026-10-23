"use client";

import { useEffect, useState } from "react";
import { ukDate } from "@/content/launch";
import { liveLine } from "@/lib/launch/sun";

/** Minutes past midnight, UK time. */
export function ukMinutes(now = new Date()): number {
  const [h, m] = now
    .toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" })
    .split(":")
    .map(Number);
  return h * 60 + m;
}

/** The sun at Chipping Campden right now, updated every minute. */
export function useLive(day?: string) {
  const [live, setLive] = useState<{ line: string; clock: string } | null>(null);
  useEffect(() => {
    const update = () => setLive(liveLine(day ?? ukDate(), ukMinutes()));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [day]);
  return live;
}

/**
 * "Right now at Chipping Campden: 16:20, and the sun's up until 17:52."
 * The server renders the day's sunrise and sunset; the clock time is added here.
 */
export default function LiveLine({ initial, day }: { initial: string; day?: string }) {
  const live = useLive(day);
  return <span>{live?.line ?? initial}</span>;
}
