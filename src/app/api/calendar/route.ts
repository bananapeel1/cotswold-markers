import { NextRequest } from "next/server";
import { OPENS } from "@/content/launch";
import { sunTimes, ukInstant, ukTime } from "@/lib/launch/sun";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// Commas, semicolons and backslashes are special in iCalendar text
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

// Lines longer than 75 octets are folded onto continuation lines starting with a space
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n ");
};

/**
 * "Add it to my calendar" after signing up: a walk from Chipping Campden on
 * the day and time the person picked, as a .ics file phones open directly.
 */
export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day") ?? "";
  const time = request.nextUrl.searchParams.get("time") ?? "09:30";
  const t = TIME.exec(time);
  if (!DAY.test(day) || Number.isNaN(Date.parse(day)) || !t || day < OPENS.firstStretch || day > "2030-12-31") {
    return Response.json({ error: "Pick a day from 15 March 2027 and a start time." }, { status: 400 });
  }

  const start = ukInstant(day, Number(t[1]) * 60 + Number(t[2]));
  const end = new Date(start.valueOf() + 5 * 3600_000);
  const sun = sunTimes(day);
  const description = [
    "The Cotswold Way starts at the Market Hall in Chipping Campden.",
    `That day: sunrise ${ukTime(sun.rise)}, sunset ${ukTime(sun.set)}.`,
    "Look out for the TrailTap plates on the waymark posts: tap or scan one for the story of where you're standing.",
    "On the trail, follow the Countryside Code: close gates, keep dogs under control, take your litter home.",
    "https://www.trailtap.uk",
  ].join("\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrailTap//Walk planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:walk-${day}-${time.replace(":", "")}@trailtap.uk`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc("Walk the Cotswold Way from Chipping Campden")}`,
    `LOCATION:${esc("Market Hall, High Street, Chipping Campden")}`,
    "GEO:52.0505;-1.7802",
    `DESCRIPTION:${esc(description)}`,
    "URL:https://www.trailtap.uk",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cotswold-way-walk-${day}.ics"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
