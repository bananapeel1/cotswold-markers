import type { Metadata, Viewport } from "next";
import LaunchSite from "@/components/launch/LaunchSite";
import { momentOn, ukDate } from "@/content/launch";

// Rebuilt every hour, so the site switches to its 15 March and June versions
// within an hour of midnight UK time, and the week counts stay right.
export const revalidate = 3600;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.trailtap.uk";
const title = "TrailTap · The Cotswold Way, told as you walk it";
const description =
  "Story markers on the waymark posts of the Cotswold Way. The first stretch, 20 markers from Chipping Campden, opens on 15 March 2027; the whole Way to Bath in June. Get the free printable map.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Cotswold Way, told as you walk it",
    description: "The first stretch opens on 15 March 2027. The whole Way, Chipping Campden to Bath, in June.",
    url: "/",
    siteName: "TrailTap",
    locale: "en_GB",
    type: "website",
  },
};

// The root layout caps zoom for the map pages; this is a reading page, so allow it
export const viewport: Viewport = {
  maximumScale: 5,
  themeColor: "#f8f4ea",
};

export default function HomePage() {
  const day = ukDate();
  return <LaunchSite moment={momentOn(day)} day={day} />;
}
