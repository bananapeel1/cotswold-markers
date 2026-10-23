/**
 * Sunrise, sunset and the sun's height at Chipping Campden, after Vladimir
 * Agafonkin's SunCalc (BSD-2-Clause). Small enough to inline rather than
 * pull in a dependency for one line of copy.
 */

const LAT = 52.0505;
const LNG = -1.7802;
const PI = Math.PI;
const rad = PI / 180;
const dayMs = 864e5;
const J1970 = 2440588;
const J2000 = 2451545;
const OBL = rad * 23.4397;

const toDays = (d: Date) => d.valueOf() / dayMs - 0.5 + J1970 - J2000;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs);
const meanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (M: number) =>
  M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + PI;
const declination = (l: number) => Math.asin(Math.sin(OBL) * Math.sin(l));
const rightAscension = (l: number) => Math.atan2(Math.sin(l) * Math.cos(OBL), Math.cos(l));

/** The sun's altitude in degrees at a moment. */
export function sunAltitude(date: Date): number {
  const lw = rad * -LNG;
  const phi = rad * LAT;
  const d = toDays(date);
  const L = eclipticLongitude(meanAnomaly(d));
  const dec = declination(L);
  const H = rad * (280.16 + 360.9856235 * d) - lw - rightAscension(L);
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / rad;
}

/** Sunrise, sunset and civil dawn and dusk for a YYYY-MM-DD day. */
export function sunTimes(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const lw = rad * -LNG;
  const phi = rad * LAT;
  const d = toDays(date);
  const J0 = 0.0009;
  const n = Math.round(d - J0 - lw / (2 * PI));
  const ds = J0 + lw / (2 * PI) + n;
  const M = meanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const transit = (a: number) => J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const noon = transit(ds);
  const at = (h: number): [Date, Date] => {
    const w = Math.acos((Math.sin(h * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    const set = transit(J0 + (w + lw) / (2 * PI) + n);
    return [fromJulian(noon - (set - noon)), fromJulian(set)];
  };
  const [rise, set] = at(-0.833);
  const [dawn, dusk] = at(-6);
  return { rise, set, dawn, dusk };
}

/** HH:MM in UK time. */
export function ukTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
}

/** The instant a UK wall-clock time happens on a given day. */
export function ukInstant(day: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  const guess = new Date(`${day}T${hh}:${mm}:00Z`);
  const offset =
    new Date(guess.toLocaleString("en-US", { timeZone: "Europe/London" })).valueOf() -
    new Date(guess.toLocaleString("en-US", { timeZone: "UTC" })).valueOf();
  return new Date(guess.valueOf() - offset);
}

/** "Today at Chipping Campden" line for server rendering (no clock time). */
export function daylightLine(day: string): string {
  const t = sunTimes(day);
  return `Today at Chipping Campden: sunrise ${ukTime(t.rise)}, sunset ${ukTime(t.set)}.`;
}

/** "Right now at Chipping Campden" line for a UK wall-clock time on a day. */
export function liveLine(day: string, minutes: number): { line: string; clock: string } {
  const at = ukInstant(day, minutes);
  const alt = sunAltitude(at);
  const t = sunTimes(day);
  const T = ukTime(at);
  const s =
    alt > 0
      ? `${T}, and the sun's up until ${ukTime(t.set)}`
      : at < t.rise
        ? alt > -6
          ? `${T}, first light. Sunrise at ${ukTime(t.rise)}`
          : `${T}, still dark. Sunrise at ${ukTime(t.rise)}`
        : alt > -6
          ? `${T}, dusk. The sun set at ${ukTime(t.set)}`
          : `${T}, dark since ${ukTime(t.dusk)}`;
  return { line: `Right now at Chipping Campden: ${s}.`, clock: T };
}
