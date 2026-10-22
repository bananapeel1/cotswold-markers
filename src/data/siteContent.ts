// Editable page copy ("Pages & Copy" in /admin) — one Firestore doc per page
// in the `siteContent` collection, falling back to the in-code defaults below
// so the site renders identically with no database configured.
//
// Body text convention across the product: PLAIN TEXT, paragraphs split on
// "\n\n" (no markdown).
//
// NOTE: hero image / tagline / social links live in `siteSettings` and are
// edited in /admin/settings — they are deliberately NOT part of these docs.

import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { readWithFallback } from "@/lib/firestoreRead";

export interface HowItWorksStep {
  icon: string; // material symbol name
  title: string;
  body: string;
}

export interface WanderersFeature {
  icon: string; // material symbol name
  title: string;
  body: string;
}

export interface TrailHighlightItem {
  name: string;
  markerId: string; // marker shortCode, e.g. "CW02" — the card links to /m/{markerId}
  blurb: string;
  imageUrl: string;
}

export interface HomepageContent {
  howItWorks: {
    heading: string;
    sub: string; // small uppercase kicker above the heading
    steps: HowItWorksStep[]; // exactly 3 — card styling is positional
  };
  wanderers: {
    heading: string;
    body: string;
    features: WanderersFeature[]; // exactly 2
    imageNote?: string; // sub-line on the floating card over the image
  };
  trailHighlights: {
    heading: string;
    sub: string; // small uppercase kicker above the heading
    items: TrailHighlightItem[]; // exactly 3 — tag/icon styling is positional
  };
}

export interface LegalSection {
  heading: string;
  body: string; // plain text, paragraphs split on "\n\n"
}

export interface LegalContent {
  lastUpdated: string;
  sections: LegalSection[];
}

export interface SponsorTier {
  name: string;
  price: string; // e.g. "£45"
  period: string; // e.g. "/yr"
  features: string[];
  highlighted?: boolean; // gets the "Most Popular" treatment
}

export interface SponsorsContent {
  heroBadge: string;
  heroHeading: string;
  heroBody: string;
  pricingHeading: string;
  pricingSub: string;
  tiers: SponsorTier[];
}

export interface MiscContent {
  rewardsTeaser: string; // "Coming Soon" pill on the marker-page reward card
}

export interface SiteContentMap {
  homepage: HomepageContent;
  privacy: LegalContent;
  terms: LegalContent;
  sponsors: SponsorsContent;
  misc: MiscContent;
}

export type SiteContentPage = keyof SiteContentMap;

export const DEFAULT_SITE_CONTENT: SiteContentMap = {
  homepage: {
    howItWorks: {
      heading: "Your digital guide to the physical world.",
      sub: "The Methodology",
      steps: [
        {
          icon: "qr_code_scanner",
          title: "Tap/Scan Marker",
          body: "Find a TrailTap marker on a post along the Cotswold Way. Tap it with your phone or scan the code.",
        },
        {
          icon: "explore",
          title: "Discover Local Context",
          body: "Instant access to trail history, nearby stops, and live information for your location.",
        },
        {
          icon: "hiking",
          title: "Enjoy Your Journey",
          body: "Continue walking with confidence, knowing where the nearest water, food, or rest is.",
        },
      ],
    },
    wanderers: {
      heading: "Explore the Cotswold Way. Find food, water, and rest.",
      body: "Never worry about where the trail ends or when the next refill station appears. Our real-time marker system updates with community reports on trail conditions and local business availability.",
      features: [
        {
          icon: "restaurant",
          title: "Curated Rest Stops",
          body: "The best local pubs, cafes, and inns along the Cotswold Way.",
        },
        {
          icon: "water_drop",
          title: "Verified Water Points",
          body: "Community-verified fountain and spring status reports.",
        },
      ],
      imageNote: "Pubs, cafes & rest points",
    },
    trailHighlights: {
      heading: "Stories, legends & local secrets.",
      sub: "Collected Along the Way",
      items: [
        {
          name: "Broadway Tower",
          markerId: "CW04",
          blurb:
            "A folly perched at 1,024 feet with views across 16 counties. Built for Lady Coventry in the 1790s.",
          imageUrl: "",
        },
        {
          name: "Cleeve Common",
          markerId: "CW13",
          blurb:
            "The largest area of unimproved limestone grassland in the Cotswolds, home to rare orchids and skylarks.",
          imageUrl: "",
        },
        {
          name: "The Devil's Chimney",
          markerId: "CW16",
          blurb:
            "A natural limestone pinnacle with a folklore legend — the devil himself is said to have climbed it.",
          imageUrl: "",
        },
      ],
    },
  },

  privacy: {
    lastUpdated: "27 March 2026",
    sections: [
      {
        heading: "Who we are",
        body: "TrailTap is operated by the TrailTap team. Contact: thecotswoldsway@protonmail.com",
      },
      {
        heading: "What data we collect",
        body: "Account data: If you create an account, we store your email address and display name via Google Firebase Authentication.\n\nScan data: When you scan a QR code marker, we record which marker was scanned and when, linked to your account if you are signed in.\n\nLocation data: If you use the “Near Me” feature, your device’s GPS coordinates are used locally in your browser to show nearby points of interest. We do not store your location on our servers.\n\nTrail condition reports: If you submit a trail condition report, we store the report content, timestamp, and associated marker.\n\nJournal entries: If you write journal entries, these are stored in your browser’s local storage and are not sent to our servers.",
      },
      {
        heading: "How we use your data",
        body: "To provide your trail progress, badges, and scan history\n\nTo display community statistics (anonymised scan counts)\n\nTo show trail condition reports to other walkers\n\nTo improve the app experience\n\nWe do not sell your data to third parties.",
      },
      {
        heading: "Third-party services",
        body: "Google Firebase: Authentication, database, and file storage. See the Firebase Privacy Policy at https://firebase.google.com/support/privacy\n\nMapbox: Trail maps. See the Mapbox Privacy Policy at https://www.mapbox.com/legal/privacy\n\nVercel: Hosting. See the Vercel Privacy Policy at https://vercel.com/legal/privacy-policy",
      },
      {
        heading: "Cookies",
        body: "We use essential cookies for authentication (Firebase session tokens). We do not use advertising or tracking cookies. Mapbox may set performance cookies for map tile caching.",
      },
      {
        heading: "Your rights",
        body: "Under UK GDPR, you have the right to access, correct, or delete your personal data. To exercise these rights, email thecotswoldsway@protonmail.com.",
      },
      {
        heading: "Data retention",
        body: "Account and scan data is retained for as long as your account is active. You can request deletion at any time. Trail condition reports are automatically removed after 30 days.",
      },
      {
        heading: "Changes to this policy",
        body: "We may update this policy from time to time. The latest version will always be available at this page.",
      },
    ],
  },

  terms: {
    lastUpdated: "27 March 2026",
    sections: [
      {
        heading: "1. About TrailTap",
        body: "TrailTap is a trail companion app for the Cotswold Way National Trail. It provides information about points of interest, facilities, and stories along the 102-mile route from Chipping Campden to Bath. The app is provided by the TrailTap team.",
      },
      {
        heading: "2. Use of the app",
        body: "TrailTap is provided as a supplementary guide only. It is not a substitute for proper navigation equipment, maps, or common sense. Always carry a physical map and compass when walking the Cotswold Way.\n\nMobile signal is intermittent along much of the trail. Do not rely solely on this app for navigation or emergency information.",
      },
      {
        heading: "3. Accuracy of information",
        body: "We make every effort to ensure information (opening hours, facilities, trail conditions) is accurate and up to date. However, conditions change and we cannot guarantee accuracy. Always verify critical information (especially accommodation and transport) independently.\n\nTrail condition reports are submitted by other walkers and are not verified by TrailTap. Use your own judgement on the trail.",
      },
      {
        heading: "4. Safety",
        body: "Walking the Cotswold Way involves inherent risks including uneven terrain, steep slopes, livestock, weather exposure, and remote locations with no mobile signal. TrailTap accepts no liability for injury, loss, or damage arising from use of the trail or reliance on information provided in this app.\n\nIn an emergency, call 999 and ask for Mountain Rescue (Gloucestershire Cave & Mountain Rescue Team covers the Cotswold Way).",
      },
      {
        heading: "5. User accounts",
        body: "You may create an account to track your progress and earn badges. You are responsible for maintaining the security of your account. We reserve the right to suspend accounts that are used to submit false trail condition reports or abuse the platform.",
      },
      {
        heading: "6. Content",
        body: "Historical and cultural content on TrailTap is researched from public sources including English Heritage, National Trust, and local history records. If you believe any content is inaccurate, please contact us at thecotswoldsway@protonmail.com.",
      },
      {
        heading: "7. QR code markers",
        body: "Physical QR code markers along the trail are the property of TrailTap. Tampering with, removing, or damaging markers is not permitted.",
      },
      {
        heading: "8. Changes",
        body: "We may update these terms from time to time. Continued use of TrailTap after changes constitutes acceptance of the updated terms.",
      },
      {
        heading: "9. Governing law",
        body: "These terms are governed by the laws of England and Wales.",
      },
    ],
  },

  sponsors: {
    heroBadge: "Business Solutions",
    heroHeading: "Connect with walkers, right where they are.",
    heroBody:
      "Bridge the gap between digital discovery and physical exploration. Place your brand directly on the trail through smart physical markers and contextual rewards.",
    pricingHeading: "Ready to join the trail?",
    pricingSub: "Flexible plans for local shops and national brands.",
    tiers: [
      {
        name: "Trail Starter",
        price: "£45",
        period: "/yr",
        features: [
          "1 Physical NFC/QR Marker",
          "Direct Link to Your Offer",
          "Basic Performance Stats",
        ],
      },
      {
        name: "Trail Leader",
        price: "£120",
        period: "/yr",
        features: [
          "3 Physical NFC/QR Markers",
          "Location-Based Alerts",
          "Advanced Analytics & Heatmaps",
          "Priority Map Placement",
        ],
        highlighted: true,
      },
    ],
  },

  misc: {
    rewardsTeaser: "Launching Summer 2026",
  },
};

/**
 * Merged content for a page: Firestore `siteContent/{page}` over the in-code
 * default. Merge is shallow per top-level key, so a doc missing e.g.
 * `wanderers` falls back to the default `wanderers` wholesale.
 */
export async function getSiteContent<K extends SiteContentPage>(
  page: K
): Promise<SiteContentMap[K]> {
  const fallback = DEFAULT_SITE_CONTENT[page];
  if (!isFirestoreAvailable()) return fallback;

  const stored = await readWithFallback<Record<string, unknown> | null>(
    "siteContent",
    page,
    async () => {
      const doc = await getDb().collection("siteContent").doc(page).get();
      return doc.exists ? (doc.data() as Record<string, unknown>) : null;
    },
    () => null
  );
  if (!stored) return fallback;
  return Object.assign({}, fallback, stored) as SiteContentMap[K];
}
