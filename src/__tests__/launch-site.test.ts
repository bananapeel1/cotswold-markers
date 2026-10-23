import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { FIRST_STRETCH_KM, OPENS, QUESTIONS, copyFor, momentOn, signupWordsFor, ukDate, weeksBetween } from "@/content/launch";
import { STRIP_VARIANTS, eleAt, placeAt, stripLayout, walkerAt } from "@/lib/launch/geo";
import { sunTimes, ukTime, liveLine } from "@/lib/launch/sun";
import { GET as calendar } from "@/app/api/calendar/route";

describe("which version of the site shows", () => {
  it("switches on the UK date, not UTC", () => {
    // 23:30 UTC on 13 June is already 00:30 on 14 June in British Summer Time
    expect(ukDate(new Date("2027-03-15T00:30:00Z"))).toBe("2027-03-15");
    expect(ukDate(new Date("2027-06-13T23:30:00Z"))).toBe("2027-06-14");
  });

  it("opens the first stretch on 15 March and the whole Way on the June date", () => {
    expect(momentOn("2026-10-26")).toBe("before");
    expect(momentOn("2027-03-14")).toBe("before");
    expect(momentOn(OPENS.firstStretch)).toBe("first");
    expect(momentOn("2027-06-13")).toBe("first");
    expect(momentOn(OPENS.wholeWay)).toBe("whole");
  });

  it("counts whole weeks to each opening", () => {
    expect(weeksBetween("2026-10-26", OPENS.firstStretch)).toBe(20);
    expect(weeksBetween(OPENS.firstStretch, OPENS.wholeWay)).toBe(13);
  });

  it("never promises the whole Way before June", () => {
    for (const moment of ["before", "first"] as const) {
      const all = JSON.stringify({ ...copyFor(moment), ...signupWordsFor(moment) }).toLowerCase();
      expect(all).not.toMatch(/fifty trailtap plates are on|all 50 (are )?open|open now.*bath/);
    }
  });

  it("only says the answers are on the posts once they are", () => {
    expect(copyFor("before").answer).toMatch(/from 15 March/);
    expect(copyFor("first").answer).toMatch(/there now/);
  });
});

describe("questions on the strip", () => {
  it("are all on the first stretch and never give an answer away", () => {
    for (const q of QUESTIONS) {
      expect(q.km).toBeGreaterThan(0);
      expect(q.km).toBeLessThan(FIRST_STRETCH_KM);
      expect(q.question.trim().endsWith("?")).toBe(true);
      expect(q.credit).toMatch(/CC BY/);
      expect(q.creditUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });
});

describe("strip map layout", () => {
  for (const variant of STRIP_VARIANTS) {
    it(`${variant}: runs down the page and leaves room for every card`, () => {
      const L = stripLayout(variant);
      expect(L.ys).toHaveLength(FIRST_STRETCH_KM * 10 + 1);
      for (let i = 1; i < L.ys.length; i++) expect(L.ys[i]).toBeGreaterThan(L.ys[i - 1]);
      // each card's slot is at least the room it was given, so cards can't overlap
      const tops = [...QUESTIONS].sort((a, b) => a.km - b.km).map((q) => L.yOfKm(q.km) - L.room);
      for (let i = 1; i < tops.length; i++) expect(tops[i] - tops[i - 1]).toBeGreaterThanOrEqual(L.room);
    });
  }

  it("puts the walker at the start before scrolling and at Cleeve Hill at the end", () => {
    const L = stripLayout("wide");
    expect(walkerAt(L, 0).km).toBe(0);
    expect(walkerAt(L, 0).along).toBe(0);
    const end = walkerAt(L, L.ys[L.ys.length - 1]);
    expect(end.km).toBeCloseTo(FIRST_STRETCH_KM - 0.1, 1);
    expect(placeAt(0)).toBe("Chipping Campden");
    expect(placeAt(30)).toBe("Sudeley Castle");
  });

  it("reads heights from the real elevation data", () => {
    expect(eleAt(0)).toBeGreaterThan(100);
    expect(eleAt(0)).toBeLessThan(200);
    expect(eleAt(7.25)).toBeGreaterThan(250); // Broadway Tower is on the top of the edge
  });
});

describe("sun at Chipping Campden", () => {
  it("gives sunrise and sunset in UK time for the opening day", () => {
    const t = sunTimes(OPENS.firstStretch);
    // solar noon there is about 12:17 GMT in mid-March, with just under 12 hours of daylight
    expect(ukTime(t.rise)).toMatch(/^06:2\d$/);
    expect(ukTime(t.set)).toMatch(/^18:1\d$/);
    // and the longest and shortest days
    expect(ukTime(sunTimes("2027-06-21").rise)).toMatch(/^04:4\d$/);
    expect(ukTime(sunTimes("2026-12-21").set)).toMatch(/^15:5\d$/);
  });

  it("describes the light at a moment in the day", () => {
    expect(liveLine(OPENS.firstStretch, 12 * 60).line).toMatch(/12:00, and the sun's up until 18:/);
    expect(liveLine(OPENS.firstStretch, 3 * 60).line).toMatch(/still dark/);
  });
});

describe("GET /api/calendar", () => {
  const get = (q: string) => calendar(new NextRequest(`http://localhost/api/calendar?${q}`));

  it("returns a calendar file for the walk, in UK time", async () => {
    const res = await get("day=2027-03-20&time=09:30");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/calendar/);
    expect(res.headers.get("content-disposition")).toMatch(/cotswold-way-walk-2027-03-20\.ics/);
    const ics = await res.text();
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toContain("DTSTART:20270320T093000Z"); // GMT in March before the clocks change
    expect(ics).toContain("SUMMARY:Walk the Cotswold Way from Chipping Campden");
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });

  it("uses British Summer Time after the clocks change", async () => {
    const ics = await (await get("day=2027-06-19&time=09:30")).text();
    expect(ics).toContain("DTSTART:20270619T083000Z");
  });

  it("refuses days before the first stretch opens and malformed input", async () => {
    expect((await get("day=2027-03-01&time=09:30")).status).toBe(400);
    expect((await get("day=tomorrow&time=09:30")).status).toBe(400);
    expect((await get("day=2027-03-20&time=25:00")).status).toBe(400);
  });
});
