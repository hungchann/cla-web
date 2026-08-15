import { describe, it, expect, afterEach } from "vitest";
import { saveReferrer, getReferrer, clearReferrer } from "@/lib/referral";

describe("referral helpers", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("saves and reads a referrer", () => {
    saveReferrer("user-ref-1");
    expect(getReferrer()).toBe("user-ref-1");
  });

  it("ignores empty/blank referrer", () => {
    saveReferrer("");
    saveReferrer(null);
    expect(getReferrer()).toBeNull();
  });

  it("overwrites the previous referrer", () => {
    saveReferrer("ref-a");
    saveReferrer("ref-b");
    expect(getReferrer()).toBe("ref-b");
  });

  it("clears the referrer", () => {
    saveReferrer("user-ref-1");
    clearReferrer();
    expect(getReferrer()).toBeNull();
  });
});
