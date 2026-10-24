/**
 * Everything the launch site says that changes over time lives here: the
 * two opening dates, the questions on the strip map and the copy for each of
 * the site's three moments. The server works out which moment it is from
 * the date in the UK, so nothing switches early in the page source.
 *
 * Rules (launch plan, 19 Oct 2026): no early-access words, no CWA/CNL names,
 * no marker locations before they're agreed, and never imply markers on the
 * whole Way before June. Since 24 Oct 2026 nothing is held back for effect:
 * each question shows its short answer here, and the full story is at the post.
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
  /** Two lines from the real story in the app; the full story is at the post. */
  answer: string;
  photo: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

export const QUESTIONS: LaunchQuestion[] = [
  {
    where: "Dover's Hill",
    km: 2.15,
    question: "Why did this hilltop get its own Olympics in 1612, shin-kicking and all?",
    answer:
      "A local lawyer, Robert Dover, started his Olimpick Games here, with James I's blessing. Revived in 1951 and 1963, they've run every year since 1966.",
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
    answer:
      "Lady Coventry wanted to know if a beacon lit here could be seen from her home, Croome Court, 22 miles away. It could.",
    photo: "/launch/CW04.jpg",
    alt: "Broadway Tower on its hilltop",
    credit: "Newton2, cropped by Yummifruitbat, CC BY 2.5",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Broadway_tower_edit.jpg",
  },
  {
    where: "Above Snowshill",
    km: 12.45,
    question: "Why did one man fill a manor with 22,000 objects, then sleep in the cottage next door?",
    answer:
      "Charles Wade's motto was ‘Let nothing perish’. Every room of Snowshill Manor went to the collection, from samurai armour to bicycles.",
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
    answer: "Water from the hills above does the work. It's the tallest gravity-fed fountain in the world.",
    photo: "/launch/CW07.jpg",
    alt: "Swans on the water at Stanway",
    credit: "mattbuck, CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Stanway_House_MMB_02.jpg",
  },
  {
    where: "Hailes Abbey",
    km: 25.3,
    question: "What did pilgrims walk here to see, for nearly 270 years?",
    answer:
      "A phial said to hold the blood of Christ, brought back from the Crusades in 1270. In 1538 the King's men called it honey coloured with saffron.",
    photo: "/launch/CW08.jpg",
    alt: "The ruins of Hailes Abbey",
    credit: "Saffron Blaze, CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Hailes_Abbey_Landscape.jpg",
  },
  {
    where: "Belas Knap",
    km: 32.29,
    question: "Why does a tomb older than Stonehenge have a front door that goes nowhere?",
    answer:
      "The real burial chambers are hidden in its sides. The false door may have been there to fool robbers, or for the spirits of the dead.",
    photo: "/launch/CW11.jpg",
    alt: "Belas Knap long barrow",
    credit: "Stephen Craven, CC BY-SA 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Belas_Knap_long_barrow_-_geograph.org.uk_-_2809551.jpg",
  },
];

/** Photo on the sample marker page the phone shows in the hero. */
export const DEMO_PHOTO = {
  src: "/launch/CW04.jpg",
  credit: "Newton2, cropped by Yummifruitbat, CC BY 2.5",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Broadway_tower_edit.jpg",
};

/**
 * What the phone in the hero shows: the real marker page for Broadway Tower
 * (/m/cw-02-broadway-tower), copied from the live app on 23 Oct 2026. Keep it
 * in step with the app if the marker's details change in /admin. The scan
 * count is left out: it isn't a real number until the plates are up.
 *
 * The miles are measured along the real route, as on the walk map (the Tower
 * is 4.5 miles from Chipping Campden, Broadway village 5.9). The app's own
 * marker data still says Mile 5.5 and 8: fix those in /admin to match.
 * Times use the app's pace (24 minutes a mile); heights are from here.
 */
export const DEMO_PAGE = {
  name: "Broadway Tower",
  credit: "Photo: The author is Newton2 (cropped by Yummifruitbat) · CC BY 2.5",
  next: [
    { name: "Broadway Tower", here: true, detail: "You are here · Mile 4.5 · 312m" },
    { name: "Broadway Village Green", mi: "1.4 mi", time: "~34min", drop: "↓207m" },
    { name: "Snowshill Lavender View", mi: "3.2 mi", time: "~1h 17min", drop: "↓124m" },
  ],
  weather: "6°C · Partly cloudy",
  discovery: [
    { ask: "Need a break?", what: "The Broadway Hotel", dist: "1.4 mi", icon: "stay", tint: "#10b981", bg: "#ecfdf5", ink: "#047857" },
    { ask: "Hungry?", what: "Broadway Tower Café", dist: "241 yards", icon: "food", tint: "#f59e0b", bg: "#fffbeb", ink: "#b45309" },
    { ask: "Thirsty?", what: "Water Tap (Tower Car Park)", dist: "Right here", icon: "water", tint: "#0ea5e9", bg: "#f0f9ff", ink: "#0284c7" },
    { ask: "Need supplies?", what: "Broadway Deli", dist: "1.3 mi", icon: "shop", tint: "#8b5cf6", bg: "#f5f3ff", ink: "#7c3aed" },
  ],
  toilets: { name: "Toilets (Broadway Tower)", hours: "Tower Barn: 9.30am-4pm weekdays, 9am-5pm weekends", dist: "309 yards" },
  // Look Out For on the same page (src/data/seasonal.ts, cw-02-broadway-tower)
  look: [
    { icon: "eye", text: "Clearest views on cold, still mornings — up to 16 counties", months: "Oct-Feb" },
    { icon: "bird", text: "Red kites and buzzards soaring on thermals", months: "Year-round" },
    { icon: "frost", text: "First frost often visible from the tower at dawn", months: "Nov-Jan" },
  ],
} as const;

/** The real page for the Broadway Tower post. `source=web` keeps these visits out of the scan count. */
export const DEMO_PAGE_URL = "/m/CW04?source=web";

/**
 * How the real page orders the four Discovery cards by the weather at the post
 * (getWeatherOrder in src/components/ContextualPrompts.tsx; "hot" is 25°C and up).
 */
export const WEATHER_ORDERS = [
  { id: "dry", label: "Dry morning", chip: "11°C · Clear sky", order: ["food", "water", "stay", "shop"], say: "Food first." },
  { id: "rain", label: "Raining", chip: "8°C · Light rain", order: ["stay", "food", "water", "shop"], say: "Shelter first." },
  { id: "hot", label: "Hot day", chip: "27°C · Sunny", order: ["water", "food", "stay", "shop"], say: "Water first." },
] as const;

/**
 * The towns on the walk through the first stretch, between the questions.
 * `km` is distance along the Way. Only what's in town, never where a plate is.
 */
export const WALK_TOWNS = [
  { km: 0, where: "Chipping Campden", heading: "Start at the Market Hall", has: ["food", "shop", "loo", "stay"] },
  { km: 9.47, where: "Broadway", heading: "The lunch stop", has: ["food", "shop", "loo", "stay"] },
  { km: 28.87, where: "Winchcombe", heading: "Last town before the climb", has: ["food", "shop", "loo", "stay"] },
] as const;

/** Heights for the question cards on the walk, where the route data misses the top. */
export const WALK_HEIGHTS: Record<string, number> = {
  "Dover's Hill": 226,
  "Broadway Tower": 312,
  "Above Snowshill": 188,
  Stanway: 94,
  "Hailes Abbey": 105,
  "Belas Knap": 301,
};

/**
 * Public contact address. This is the one already published on /sponsors;
 * swap it for a trailtap.uk mailbox once one exists.
 */
export const CONTACT_EMAIL = "thecotswoldsway@protonmail.com";

export const PROMISES = [
  "Plates go only on existing posts, with permission. Nothing new is added to the landscape.",
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
      ? "Fifty TrailTap plates are on the waymark posts from Chipping Campden to Bath. Tap or scan one and your phone shows the nearest water, food and toilets, the way ahead, and the story of where you're standing."
      : before
        ? "TrailTap plates are going on the waymark posts. Tap or scan one with your phone and it shows the nearest water, food and toilets, the way ahead, and the story of where you're standing. Free, with nothing to download."
        : "The first twenty TrailTap plates are on the waymark posts from Chipping Campden. Tap or scan one and your phone shows the nearest water, food and toilets, the way ahead, and the story of where you're standing. The rest of the Way follows in June.",
    heroLede: whole
      ? "Fifty plates on the waymark posts, Chipping Campden to Bath. Tap one and your phone shows the nearest water, food and toilets, how far it is to the next village, and the story of where you're standing."
      : before
        ? "From 15 March 2027, small plates go on the waymark posts. Tap one and your phone shows the nearest water, food and toilets, how far it is to the next village, and the story of where you're standing."
        : "Twenty plates on the waymark posts from Chipping Campden. Tap one and your phone shows the nearest water, food and toilets, how far it is to the next village, and the story of where you're standing.",
    walkHeading: before
      ? "Twenty plates. The first 22 miles. Walk them here first."
      : "The first 22 miles, Chipping Campden to Cleeve Hill.",
    walkEnd: whole
      ? "The highest ground on the whole Cotswold Way is just above you. The plates carry on all the way to Bath."
      : "The highest ground on the whole Cotswold Way is just above you. The plates on to Bath follow in June.",
    joinHeading: whole
      ? "Fifty plates, Chipping Campden to Bath."
      : before
        ? "The first twenty plates go up on 15 March 2027."
        : "Twenty plates are on the posts now.",
    joinText: whole
      ? "All the way along the Cotswold Way, on the posts that are already there."
      : before
        ? "Chipping Campden to Cleeve Hill. The rest of the Way, on to Bath, follows in June."
        : "Chipping Campden to Cleeve Hill, since 15 March. The rest of the Way, on to Bath, follows in June.",
    primaryCta: "Get the stories",
    secondaryCta: before ? "Walk the first stretch" : "Start at Chipping Campden",
    southText: whole
      ? "From Cleeve Hill the Way runs another 80 miles along the edge of the Cotswolds, past Painswick, Dursley and Wotton-under-Edge, to Bath Abbey. Since June all 50 plates are on the trail."
      : "From Cleeve Hill the Way runs another 80 miles along the edge of the Cotswolds, past Painswick, Dursley and Wotton-under-Edge, to Bath Abbey. In June the other 30 plates go up, and all 50 are on the trail.",
    fullStory: before ? "The full story is on the post from 15 March." : "The full story is on the post: walk up and tap.",
    paperHeading: whole
      ? "A story from the Cotswold Way, every fortnight."
      : before
        ? "A story from the first stretch, every fortnight."
        : "A story from further along the Way, every fortnight.",
    paperSub: whole
      ? "Checked stories from all along the Way, Chipping Campden to Bath."
      : before
        ? "Checked stories from the places between Chipping Campden and Cleeve Hill, from December until the plates go up."
        : "Checked stories from the stretch on to Bath, until those plates go up in June.",
    firstStory: before ? "Your first story arrives in December." : "Your first story arrives within a fortnight.",
    gets: before
      ? [
          {
            when: "From December",
            what: "A story from the first stretch every fortnight: the people and places behind the plates, checked before it's sent.",
          },
          { when: "14 March", what: "One email the evening before the first stretch opens." },
          { when: "June", what: "One email when the whole Way opens." },
        ]
      : whole
        ? [
            { when: "Every fortnight", what: "A story from somewhere on the Way, checked before it's sent." },
            {
              when: "Monthly",
              what: "Notes from the trail, if you tick the box: the season and what's changed on the Way.",
            },
          ]
        : [
            { when: "Every fortnight", what: "A story from the stretch on to Bath, until those plates go up." },
            { when: "June", what: "One email when the whole Way opens." },
            {
              when: "Monthly",
              what: "Notes from the trail, if you tick the box: the season and how the rest of the Way is coming along.",
            },
          ],
    groupsText: whole
      ? "Walking groups, inns and holiday companies: tick the box on the form and we'll send the walk leaders' pack."
      : before
        ? "Walking groups, inns and holiday companies: tick the box on the form and we'll send the walk leaders' pack in the new year, in time for 15 March."
        : "Walking groups, inns and holiday companies: tick the box on the form and we'll send the walk leaders' pack.",
  };
}

/**
 * The words next to the sign-up button and boxes. Stored verbatim with every
 * sign-up as the consent record, so bump SIGNUP_CONSENT_VERSION whenever any
 * of them change.
 */
export const SIGNUP_CONSENT_VERSION = "2026-10-24";

export function signupWordsFor(moment: Moment) {
  return {
    button:
      moment === "before"
        ? "Pressing the button means we email you a story from the first stretch every fortnight until 15 March, and tell you when each stretch opens. Nothing else unless you tick a box above. Every email has an unsubscribe link."
        : moment === "first"
          ? "Pressing the button means we email you a story from further along the Way every fortnight, and tell you when the whole Way opens in June. Nothing else unless you tick a box above. Every email has an unsubscribe link."
          : "Pressing the button means we email you a story from the Cotswold Way every fortnight. Nothing else unless you tick a box above. Every email has an unsubscribe link.",
    notesLabel: "Also send Notes from the trail",
    notesHint:
      moment === "before"
        ? "The season on the Way, about once a month from December. Stop any time."
        : "The season on the Way, about once a month. Stop any time.",
    leaderLabel: "I lead walks, or run an inn or holiday company on the trail",
    leaderHint:
      moment === "before"
        ? "We'll send the walk leaders' pack in the new year: poster, A4 map, a 5 to 8 mile section with parking and bus notes."
        : "We'll send the walk leaders' pack: poster, A4 map, a 5 to 8 mile section with parking and bus notes.",
  };
}
