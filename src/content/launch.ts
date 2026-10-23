/**
 * Everything the launch site says that changes over time lives here: the
 * two opening dates, the questions on the strip map and the copy for each of
 * the site's three moments. The server works out which moment it is from
 * the date in the UK, so nothing switches early in the page source.
 *
 * Rules (launch plan, 19 Oct 2026): no early-access words, no CWA/CNL names,
 * no marker locations before they're agreed, and never imply markers on the
 * whole Way before June. Stories stay on the posts: the site asks questions,
 * the answers are only on the trail.
 */

export const OPENS = {
  /** The first stretch, 20 markers, Chipping Campden to Cleeve Hill. Confirmed. */
  firstStretch: "2027-03-15",
  /**
   * The whole Way, all 50 markers. Planning date only: public copy says just
   * "June 2027". Change this if the day moves; the site flips on it.
   */
  wholeWay: "2027-06-14",
} as const;

/** The first stretch ends here on the strip map (km along the Way). */
export const FIRST_STRETCH_KM = 36;
export const WHOLE_WAY_MILES = 102;
export const WHOLE_WAY_KM = 165;

export type Moment = "before" | "first" | "whole";

/** Today's date in the UK as YYYY-MM-DD. */
export function ukDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function momentOn(day: string): Moment {
  if (day >= OPENS.wholeWay) return "whole";
  if (day >= OPENS.firstStretch) return "first";
  return "before";
}

/** Whole weeks from one YYYY-MM-DD to another, rounded. */
export function weeksBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / (7 * 864e5));
}

/** A day to show on the preview pages (never used on the live homepage). */
export const PREVIEW_DAYS: Record<Moment, string> = {
  before: "2026-10-26",
  first: OPENS.firstStretch,
  whole: OPENS.wholeWay,
};

/**
 * Questions on the strip map. Each sits at a village or landmark, never at a
 * post, and goes through the same CWA/CNL check as the story it comes from.
 * `km` is distance along the Way; photos are Wikimedia Commons, credited.
 */
export interface LaunchQuestion {
  where: string;
  km: number;
  question: string;
  photo: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

export const QUESTIONS: LaunchQuestion[] = [
  {
    where: "Dover's Hill",
    km: 2.15,
    question: "Why has this hilltop held its own Olympics since 1612, shin-kicking and all?",
    photo: "/launch/CW02.jpg",
    alt: "Dover's Hill, looking out over the Vale of Evesham",
    credit: "Mat Fascione, CC BY-SA 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Dover%27s_Hill_in_the_Cotswolds_-_geograph.org.uk_-_6861408.jpg",
  },
  {
    where: "Broadway Tower",
    km: 7.25,
    question: "Who built a tower on this hill to settle one question, and was she right?",
    photo: "/launch/CW04.jpg",
    alt: "Broadway Tower on its hilltop",
    credit: "Newton2, cropped by Yummifruitbat, CC BY 2.5",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Broadway_tower_edit.jpg",
  },
  {
    where: "Above Snowshill",
    km: 12.45,
    question: "Why did one man move into a shed so his collection could have the house?",
    photo: "/launch/CW06.jpg",
    alt: "Lavender fields above Snowshill",
    credit: "Row17, CC BY-SA 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Cotswold_Lavender_-_geograph.org.uk_-_4056623.jpg",
  },
  {
    where: "Stanway",
    km: 18.86,
    question: "How does a fountain here throw water 300 feet without a pump?",
    photo: "/launch/CW07.jpg",
    alt: "Stanway House",
    credit: "mattbuck, CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Stanway_House_MMB_02.jpg",
  },
  {
    where: "Hailes Abbey",
    km: 25.3,
    question: "What did pilgrims walk here to see, for 270 years?",
    photo: "/launch/CW08.jpg",
    alt: "The ruins of Hailes Abbey",
    credit: "Saffron Blaze, CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Hailes_Abbey_Landscape.jpg",
  },
  {
    where: "Belas Knap",
    km: 32.29,
    question: "Why does a 5,500-year-old tomb have a front door that goes nowhere?",
    photo: "/launch/CW11.jpg",
    alt: "Belas Knap long barrow",
    credit: "Stephen Craven, CC BY-SA 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Belas_Knap_long_barrow_-_geograph.org.uk_-_2809551.jpg",
  },
];

/** Photo on the sample marker page in "How it works". */
export const DEMO_PHOTO = {
  src: "/launch/CW04.jpg",
  credit: "Newton2, cropped by Yummifruitbat, CC BY 2.5",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Broadway_tower_edit.jpg",
};

/**
 * Public contact address. This is the one already published on /sponsors;
 * swap it for a trailtap.uk mailbox once one exists.
 */
export const CONTACT_EMAIL = "thecotswoldsway@protonmail.com";

export const PROMISES = [
  "Markers go only on existing posts, with permission. Nothing new is added to the landscape.",
  "Every story is checked against published sources, and we fix mistakes within a day.",
  "No account needed. Without signing in, taps are anonymous. We never sell personal data.",
  "Every photo and story is credited the way its owner asks.",
  "Free to use, with nothing to download.",
  "Real people answer: email us and hear back within two working days.",
  "We only name partners when they've said yes in writing.",
];

/** Copy that changes with the moment. */
export function copyFor(moment: Moment) {
  const before = moment === "before";
  const whole = moment === "whole";
  return {
    eyebrow: whole
      ? "The Cotswold Way · Chipping Campden to Bath · Open now"
      : before
        ? "The Cotswold Way · Chipping Campden to Bath"
        : "The Cotswold Way · The first stretch is open",
    lede: whole
      ? "Fifty TrailTap plates are on the waymark posts from Chipping Campden to Bath. Tap or scan one and your phone tells you the story of where you're standing, and where the nearest water, food and rest are."
      : before
        ? "TrailTap plates are going on the waymark posts. Tap or scan one with your phone and it tells you the story of where you're standing, and where the nearest water, food and rest are. Free, with nothing to download."
        : "The first twenty TrailTap plates are on the waymark posts from Chipping Campden. Tap or scan one and your phone tells you the story of where you're standing, and where the nearest water, food and rest are. The rest of the Way follows in June.",
    primaryCta: before ? "Get the free map" : "Plan your walk",
    secondaryCta: before ? "Walk the first stretch" : "Start at Chipping Campden",
    southText: whole
      ? "From Cleeve Hill the Way runs another 80 miles along the edge of the Cotswolds, past Painswick, Dursley and Wotton-under-Edge, to Bath Abbey. Since June all 50 markers are on the trail."
      : "From Cleeve Hill the Way runs another 80 miles along the edge of the Cotswolds, past Painswick, Dursley and Wotton-under-Edge, to Bath Abbey. In June the other 30 markers go up, and all 50 are on the trail.",
    answer: before
      ? "The answer's on the post, from 15 March."
      : "Walk up to the post and tap: the answer's there now.",
    paperEyebrow: "The map, on paper",
    paperHeading: whole ? "Put the Cotswold Way in your pocket." : "Put the first stretch in your pocket.",
    gets: before
      ? [
          {
            when: "From December",
            what: "Notes from the north end, about once a month: the season on the trail and how the markers are coming along. No stories: those stay on the posts.",
          },
          {
            when: "New year",
            what: "This map as a free printable PDF: the first stretch, with water, food, toilets, the climbs, parking and buses.",
          },
          { when: "14 March", what: "One email the evening before the first stretch opens." },
          { when: "June", what: "One email when the whole Way opens." },
        ]
      : whole
        ? [
            {
              when: "Straight away",
              what: "The free printable map, with water, food, toilets, the climbs, parking and buses.",
            },
            {
              when: "Monthly",
              what: "Notes from the trail, if you tick the box: the season and what's changed on the Way.",
            },
          ]
        : [
            {
              when: "Straight away",
              what: "The free printable map of the first stretch, with water, food, toilets, the climbs, parking and buses.",
            },
            { when: "June", what: "One email when the whole Way opens." },
            {
              when: "Monthly",
              what: "Notes from the trail, if you tick the box: the season and how the rest of the Way is coming along.",
            },
          ],
    signupDone: before
      ? "The map arrives in the new year. While you're here: when do you think you'll walk it?"
      : "The map is on its way. While you're here: when do you think you'll walk it?",
    groupsText: whole
      ? "Walking groups, inns and holiday companies: tick the box on the form and we'll send the walk leaders' pack."
      : before
        ? "Walking groups, inns and holiday companies: pick any day from 15 March. Tick the box on the form and we'll send the walk leaders' pack in the new year."
        : "Walking groups, inns and holiday companies: tick the box on the form and we'll send the walk leaders' pack.",
  };
}

/**
 * The words next to the sign-up button and boxes. Stored verbatim with every
 * sign-up as the consent record, so bump SIGNUP_CONSENT_VERSION whenever any
 * of them change.
 */
export const SIGNUP_CONSENT_VERSION = "2026-10-22";

export function signupWordsFor(moment: Moment) {
  return {
    button:
      moment === "before"
        ? "Pressing the button means we email you the free map and tell you when each stretch opens: three or four emails. Nothing else unless you tick a box above. Every email has an unsubscribe link."
        : moment === "first"
          ? "Pressing the button means we email you the free map and tell you when the whole Way opens in June: two emails. Nothing else unless you tick a box above. Every email has an unsubscribe link."
          : "Pressing the button means we email you the free map. Nothing else unless you tick a box above. Every email has an unsubscribe link.",
    notesLabel: moment === "before" ? "Also send Notes from the north end" : "Also send Notes from the trail",
    notesHint:
      moment === "before" ? "About once a month, from December. Stop any time." : "About once a month. Stop any time.",
    leaderLabel: "I lead walks, or run an inn or holiday company on the trail",
    leaderHint:
      moment === "before"
        ? "We'll send the walk leaders' pack in the new year: poster, A4 map, a 5 to 8 mile section with parking and bus notes."
        : "We'll send the walk leaders' pack: poster, A4 map, a 5 to 8 mile section with parking and bus notes.",
  };
}
