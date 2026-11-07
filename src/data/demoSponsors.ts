// Preview supporters for the Broadway sponsorship visits (Nov 2026).
// Hard-coded on purpose: these businesses have not signed up, so nothing
// here lives in Firestore. Each one gets a preview marker page at /<slug>
// and its own page at /<slug>/business.

import type { POIType } from "./types";

export interface DemoSponsor {
  slug: string;
  name: string;
  typeLabel: string;
  /** Which Discovery card the business answers */
  poiType: POIType;
  /** The supporter's own line on the marker page */
  message: string;
  /** Their own button: label and where it goes */
  buttonLabel: string;
  buttonUrl: string;
  description: string[];
  address: string;
  latitude: number;
  longitude: number;
  website: string;
  websiteLabel: string;
  highlights: { icon: string; title: string; text: string }[];
}

/** The plate the previews are shown on (Broadway Tower). */
export const DEMO_MARKER_ID = "CW04";

export const DEMO_SPONSORS: DemoSponsor[] = [
  {
    slug: "lygon-arms",
    name: "The Lygon Arms",
    typeLabel: "Hotel, restaurant & bar",
    poiType: "accommodation",
    message:
      "Walkers very welcome. Come down off the hill for lunch, a drink or a bed for the night.",
    buttonLabel: "Book a table",
    buttonUrl: "https://www.lygonarmshotel.co.uk/",
    description: [
      "One of England's oldest coaching inns, on Broadway's High Street, where many walkers end their first day on the Cotswold Way.",
      "Stop for lunch or a drink on the way through, or stay the night and start the next stretch rested.",
    ],
    address: "High Street, Broadway, Worcestershire WR12 7DU",
    latitude: 52.0367,
    longitude: -1.8569,
    website: "https://www.lygonarmshotel.co.uk/",
    websiteLabel: "lygonarmshotel.co.uk",
    highlights: [
      { icon: "restaurant", title: "Lunch and dinner", text: "Come straight off the hill." },
      { icon: "local_bar", title: "A drink by the fire", text: "Muddy boots, no problem at the bar." },
      { icon: "bed", title: "A bed for the night", text: "The first night's stop for many walkers." },
    ],
  },
  {
    slug: "epicentre",
    name: "The Epicentre",
    typeLabel: "Outdoor kit & advice",
    poiType: "shop",
    message:
      "Sore feet or wet kit? Call in before the next climb and our team will sort you out.",
    buttonLabel: "Website",
    buttonUrl: "https://www.theepicentre.co.uk/",
    description: [
      "Outdoor clothing, boots and walking kit on Broadway's High Street, right on the Cotswold Way.",
      "Six miles in is when walkers find out what isn't working. Call in for socks, blister plasters, a waterproof or a second opinion on your boots.",
    ],
    address: "37 High Street, Broadway, Worcestershire",
    latitude: 52.0372,
    longitude: -1.8577,
    website: "https://www.theepicentre.co.uk/",
    websiteLabel: "theepicentre.co.uk",
    highlights: [
      { icon: "hiking", title: "Boots and socks", text: "Sort out what's rubbing before the next climb." },
      { icon: "umbrella", title: "Waterproofs", text: "For when the Cotswold weather turns." },
      { icon: "support_agent", title: "Advice", text: "Ask the team about kit for the rest of the Way." },
    ],
  },
  {
    slug: "landmark",
    name: "Landmark",
    typeLabel: "Country clothing & travel wear",
    poiType: "shop",
    message:
      "Country clothing, travel wear and our own UK-made label. Have a look round while you are in Broadway.",
    buttonLabel: "Website",
    buttonUrl: "https://www.landmarkstores.com/",
    description: [
      "On Broadway's High Street since 1997, on the Cotswold Way itself.",
      "Country clothing and travel wear, including Landmark's own UK-made label. Walkers who stop in Broadway for the night have time to look round.",
    ],
    address: "45 High Street, Broadway, Worcestershire WR12 7DP",
    latitude: 52.0371,
    longitude: -1.8581,
    website: "https://www.landmarkstores.com/",
    websiteLabel: "landmarkstores.com",
    highlights: [
      { icon: "checkroom", title: "Country clothing", text: "For the walk and for after it." },
      { icon: "luggage", title: "Travel wear", text: "Light, packable and made to be worn." },
      { icon: "verified", title: "Our own label", text: "Made in the UK." },
    ],
  },
];

export function getDemoSponsor(slug: string): DemoSponsor {
  const sponsor = DEMO_SPONSORS.find((s) => s.slug === slug);
  if (!sponsor) throw new Error(`Unknown demo sponsor: ${slug}`);
  return sponsor;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
