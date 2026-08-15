import { describe, it, expect } from "vitest";
import {
  isPremiumAccountType,
  resolvePremiumFromAccountType,
  getAccountTypeName,
  FREE_EXERCISE_LIMIT,
  FREE_NOTEBOOK_LIMIT,
} from "@/lib/premium";

describe("isPremiumAccountType", () => {
  it("returns true for canonical premium types (case-insensitive)", () => {
    expect(isPremiumAccountType("Premium", true)).toBe(true);
    expect(isPremiumAccountType("lifetime", true)).toBe(true);
    expect(isPremiumAccountType("Yearly", true)).toBe(true);
    expect(isPremiumAccountType(" monthly ", true)).toBe(true);
  });

  it("returns false for free types", () => {
    expect(isPremiumAccountType("Free", true)).toBe(false);
    expect(isPremiumAccountType("standard", true)).toBe(false);
    expect(isPremiumAccountType("basic", true)).toBe(false);
  });

  it("returns false when subscription is inactive even if type is premium", () => {
    expect(isPremiumAccountType("Lifetime", false)).toBe(false);
  });

  it("returns false for null / empty / unknown types", () => {
    expect(isPremiumAccountType(null, true)).toBe(false);
    expect(isPremiumAccountType(undefined, true)).toBe(false);
    expect(isPremiumAccountType("", true)).toBe(false);
    expect(isPremiumAccountType("mystery-plan", true)).toBe(false);
  });
});

describe("resolvePremiumFromAccountType", () => {
  it("returns true for active premium profile", () => {
    const data = {
      user_profiles: [{ account_type_id: { id: 1, name: "Lifetime" }, is_active: true }],
    };
    expect(resolvePremiumFromAccountType(data)).toBe(true);
  });

  it("returns false for free profile", () => {
    const data = {
      user_profiles: [{ account_type_id: { id: 2, name: "Free" }, is_active: true }],
    };
    expect(resolvePremiumFromAccountType(data)).toBe(false);
  });

  it("returns false for inactive premium (expired)", () => {
    const data = {
      user_profiles: [{ account_type_id: { id: 3, name: "Yearly" }, is_active: false }],
    };
    expect(resolvePremiumFromAccountType(data)).toBe(false);
  });

  it("prefers a premium profile over the first one", () => {
    const data = {
      user_profiles: [
        { account_type_id: { id: 4, name: "Free" }, is_active: true },
        { account_type_id: { id: 5, name: "Yearly" }, is_active: true },
      ],
    };
    expect(resolvePremiumFromAccountType(data)).toBe(true);
  });

  it("falls back to the first profile when none is premium", () => {
    const data = {
      user_profiles: [
        { account_type_id: { id: 6, name: "Free" }, is_active: true },
        { account_type_id: { id: 7, name: "Free" }, is_active: true },
      ],
    };
    expect(resolvePremiumFromAccountType(data)).toBe(false);
  });

  it("returns false for empty profiles or invalid input", () => {
    expect(resolvePremiumFromAccountType({ user_profiles: [] })).toBe(false);
    expect(resolvePremiumFromAccountType(null)).toBe(false);
    expect(resolvePremiumFromAccountType(undefined)).toBe(false);
    expect(resolvePremiumFromAccountType({})).toBe(false);
    expect(resolvePremiumFromAccountType("nope")).toBe(false);
  });
});

describe("getAccountTypeName", () => {
  it("returns name from account_type_id", () => {
    expect(
      getAccountTypeName({
        user_profiles: [{ account_type_id: { id: 1, name: "Yearly" } }],
      }),
    ).toBe("Yearly");
  });

  it("falls back to type field", () => {
    expect(
      getAccountTypeName({
        user_profiles: [{ account_type_id: { type: "Lifetime" } }],
      }),
    ).toBe("Lifetime");
  });

  it("returns null when no profiles", () => {
    expect(getAccountTypeName({ user_profiles: [] })).toBeNull();
    expect(getAccountTypeName(null)).toBeNull();
  });
});

describe("free limits", () => {
  it("free users get exactly 2 exercises and 1 notebook", () => {
    expect(FREE_EXERCISE_LIMIT).toBe(2);
    expect(FREE_NOTEBOOK_LIMIT).toBe(1);
  });
});
