import { describe, it, expect } from "vitest";
import { formatNumber } from "@/api/formatnumber";

describe("formatNumber", () => {
  it("formats millions with M suffix", () => {
    expect(formatNumber(2_500_000)).toBe("2.5M");
    expect(formatNumber(1_000_000)).toBe("1M");
  });

  it("strips trailing .0 from millions", () => {
    expect(formatNumber(3_000_000)).toBe("3M");
  });

  it("formats thousands with k suffix", () => {
    expect(formatNumber(1500)).toBe("2k");
    expect(formatNumber(1000)).toBe("1k");
  });

  it("returns number unchanged below 1000", () => {
    expect(formatNumber(999)).toBe(999);
    expect(formatNumber(0)).toBe(0);
  });
});
