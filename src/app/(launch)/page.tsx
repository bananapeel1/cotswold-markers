import type { Metadata, Viewport } from "next";
import LaunchSite from "@/components/launch/LaunchSite";
import { momentOn, ukDate } from "@/content/launch";

// Rebuilt every hour, so the site switches to its 15 March and June versions
// within an hour of midnight UK time, and the week counts stay right.
export const revalidate = 3600;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.trailtap.uk";
const title = "TrailTap · Tap a plate on the Cotswold Way, see what's near";
const description =
  "Plates on the waymark posts of the Cotswold Way. Tap or scan one for the nearest water, food and toilets, how far it is to the next village, and the story of where you're standing. The first 20, from Chipping Campden, go up on 15 March 2027; the rest of the Way to Bath in June.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tap a plate on the Cotswold Way, see what's near",
    description:
      "Small plates on the waymark posts show the nearest water, food and toilets, the way ahead, and the story of the spot. The first go up at Chipping Campden on 15 March 2027; the rest of the Way to Bath in June.",
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
