import { describe, it, expect } from "vitest";
import { getAssetUrl } from "@/lib/utils/assets";

describe("getAssetUrl", () => {
  it("returns absolute http URL unchanged", () => {
    expect(getAssetUrl("https://example.com/img.png")).toBe("https://example.com/img.png");
  });

  it("returns absolute https URL unchanged", () => {
    expect(getAssetUrl("https://marutek.space/assets/x.png")).toBe(
      "https://marutek.space/assets/x.png",
    );
  });

  it("returns root-relative URL unchanged", () => {
    expect(getAssetUrl("/images/logo.png")).toBe("/images/logo.png");
  });

  it("maps study_tablet.png to public images path", () => {
    expect(getAssetUrl("study_tablet.png")).toBe("/images/study_tablet.png");
  });

  it("builds asset URL for other filenames", () => {
    expect(getAssetUrl("abc-123.jpg")).toBe("https://marutek.space/assets/abc-123.jpg");
  });

  it("returns fallback when filename missing", () => {
    expect(getAssetUrl(undefined, "fallback.png")).toBe("fallback.png");
    expect(getAssetUrl(null, "fallback.png")).toBe("fallback.png");
  });

  it("returns null when filename missing and fallback is null", () => {
    expect(getAssetUrl(undefined, null)).toBeNull();
  });

  it("returns default unsplash fallback when no fallback given", () => {
    expect(getAssetUrl(undefined)).toContain("images.unsplash.com");
  });
});
