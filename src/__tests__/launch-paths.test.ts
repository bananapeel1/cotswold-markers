import { describe, expect, it } from "vitest";
import { isLaunchPath } from "@/lib/launch/paths";

describe("isLaunchPath", () => {
  it("covers the homepage, its background rebuild and the previews", () => {
    expect(isLaunchPath("/")).toBe(true);
    expect(isLaunchPath("/index")).toBe(true);
    expect(isLaunchPath("/launch-preview/first")).toBe(true);
  });

  it("leaves the app's pages alone", () => {
    expect(isLaunchPath("/home")).toBe(false);
    expect(isLaunchPath("/m/cw-01")).toBe(false);
    expect(isLaunchPath("/indexes")).toBe(false);
  });
});
