import { describe, it, expect, beforeEach } from "vitest";
import {
  isPremiumAccountType,
  getCanonicalAccountType,
  getAccountTypeDisplayName,
  resolvePremiumFromAccountType,
  getAccountTypeName,
  isCoursePremium,
  isPremiumTier,
  isTierLocked,
  canAccessCourseLesson,
  isFreePreviewChapter,
  FREE_EXERCISE_LIMIT,
  FREE_NOTEBOOK_LIMIT,
  getCompletedExerciseCount,
  incrementCompletedExerciseCount,
  resetCompletedExerciseCount,
} from "@/lib/premium";

describe("isPremiumAccountType", () => {
  it("returns true for canonical premium types (case-insensitive)", () => {
    expect(isPremiumAccountType("Premium", true)).toBe(true);
    expect(isPremiumAccountType("lifetime", true)).toBe(true);
    expect(isPremiumAccountType("Yearly", true)).toBe(true);
  });

  it("treats deprecated monthly/weekly/trial as NOT premium (aligned with mobile)", () => {
    expect(isPremiumAccountType("monthly", true)).toBe(false);
    expect(isPremiumAccountType(" weekly ", true)).toBe(false);
    expect(isPremiumAccountType("trial", true)).toBe(false);
  });

  it("returns false for free types", () => {
    expect(isPremiumAccountType("Free", true)).toBe(false);
    expect(isPremiumAccountType("standard", true)).toBe(false);
    expect(isPremiumAccountType("basic", true)).toBe(false);
  });

  it("accepts Vietnamese display names (admin hay nhập tay trong Directus)", () => {
    expect(isPremiumAccountType("Hàng năm", true)).toBe(true);
    expect(isPremiumAccountType("hàng năm", true)).toBe(true);
    expect(isPremiumAccountType("Vĩnh viễn", true)).toBe(true);
    expect(isPremiumAccountType("Cơ bản", true)).toBe(false);
  });

  it("returns false when subscription is inactive even if type is premium", () => {
    expect(isPremiumAccountType("Lifetime", false)).toBe(false);
    expect(isPremiumAccountType("Hàng năm", false)).toBe(false);
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

describe("getCanonicalAccountType", () => {
  it("maps display names to plan keys for current-plan matching", () => {
    expect(getCanonicalAccountType("Yearly")).toBe("yearly");
    expect(getCanonicalAccountType("Hàng năm")).toBe("yearly");
    expect(getCanonicalAccountType("Vĩnh viễn")).toBe("lifetime");
    expect(getCanonicalAccountType("Cơ bản")).toBe("free");
    expect(getCanonicalAccountType("mystery-plan")).toBeNull();
    expect(getCanonicalAccountType(null)).toBeNull();
  });
});

describe("getAccountTypeDisplayName", () => {
  it("maps raw types to Vietnamese display names", () => {
    expect(getAccountTypeDisplayName("Yearly")).toBe("Hàng năm");
    expect(getAccountTypeDisplayName("Hàng năm")).toBe("Hàng năm");
    expect(getAccountTypeDisplayName("Lifetime")).toBe("Vĩnh viễn");
    expect(getAccountTypeDisplayName("Free")).toBe("Miễn phí");
    expect(getAccountTypeDisplayName(null)).toBe("Miễn phí");
  });
});

describe("free limits", () => {
  it("free users get exactly 2 exercises and 1 notebook", () => {
    expect(FREE_EXERCISE_LIMIT).toBe(2);
    expect(FREE_NOTEBOOK_LIMIT).toBe(1);
  });
});

describe("isCoursePremium", () => {
  it("is true only for the premium tier (case-insensitive)", () => {
    expect(isCoursePremium({ access_tier: "premium" })).toBe(true);
    expect(isCoursePremium({ access_tier: " PREMIUM " })).toBe(true);
  });

  it("treats registered/free/empty/unknown tiers as NOT premium", () => {
    expect(isCoursePremium({ access_tier: "registered" })).toBe(false);
    expect(isCoursePremium({ access_tier: "free" })).toBe(false);
    expect(isCoursePremium({ access_tier: "" })).toBe(false);
    expect(isCoursePremium({ access_tier: null })).toBe(false);
    expect(isCoursePremium({})).toBe(false);
    expect(isCoursePremium(null)).toBe(false);
    expect(isCoursePremium(undefined)).toBe(false);
  });
});

describe("canAccessCourseLesson", () => {
  const premiumCourse = { access_tier: "premium" };
  const freeCourse = { access_tier: "free" };

  it("premium user can open any lesson in any course", () => {
    expect(canAccessCourseLesson(premiumCourse, { is_free_preview: false }, true)).toBe(true);
    expect(canAccessCourseLesson(freeCourse, { is_free_preview: false }, true)).toBe(true);
  });

  it("free user can open every lesson of a free course", () => {
    expect(canAccessCourseLesson(freeCourse, { is_free_preview: false }, false)).toBe(true);
    expect(canAccessCourseLesson(null, { is_free_preview: false }, false)).toBe(true);
  });

  it("free user only opens free-preview lessons of a premium course", () => {
    expect(canAccessCourseLesson(premiumCourse, { is_free_preview: true }, false)).toBe(true);
    expect(canAccessCourseLesson(premiumCourse, { is_free_preview: false }, false)).toBe(false);
    expect(canAccessCourseLesson(premiumCourse, {}, false)).toBe(false);
    expect(canAccessCourseLesson(premiumCourse, null, false)).toBe(false);
  });

  it("treats Directus INT 0/1 as boolean (is_free_preview: 1)", () => {
    expect(canAccessCourseLesson(premiumCourse, { is_free_preview: 1 }, false)).toBe(true);
    expect(canAccessCourseLesson(premiumCourse, { is_free_preview: 0 }, false)).toBe(false);
  });

  it("opens lessons inside a chapter tagged as free trial", () => {
    const trialChapter = { tag: "Học thử miễn phí" };
    expect(canAccessCourseLesson(premiumCourse, { is_free_preview: 0 }, false, trialChapter)).toBe(true);
    expect(canAccessCourseLesson(premiumCourse, {}, false, trialChapter)).toBe(true);
    expect(canAccessCourseLesson(premiumCourse, {}, false, { tag: "" })).toBe(false);
  });

  it("opens lessons inside a chapter with is_free_preview = 1", () => {
    expect(canAccessCourseLesson(premiumCourse, {}, false, { is_free_preview: 1 })).toBe(true);
    expect(canAccessCourseLesson(premiumCourse, {}, false, { is_free_preview: 0 })).toBe(false);
  });
});

describe("isTierLocked (cổng chung mọi loại content)", () => {
  it("locks a premium item for free users only", () => {
    expect(isTierLocked({ access_tier: "premium" }, false)).toBe(true);
    expect(isTierLocked({ access_tier: "premium" }, true)).toBe(false);
  });

  it("never locks free/empty items", () => {
    expect(isTierLocked({ access_tier: "free" }, false)).toBe(false);
    expect(isTierLocked({}, false)).toBe(false);
    expect(isTierLocked(null, false)).toBe(false);
    expect(isTierLocked(undefined, false)).toBe(false);
  });

  it("works for any content type (video / Sections / book)", () => {
    expect(isPremiumTier({ access_tier: "premium" })).toBe(true);
    expect(isTierLocked({ access_tier: "registered" }, false)).toBe(false);
  });
});

describe("isFreePreviewChapter", () => {
  it("matches Vietnamese diacritic tags case-insensitively", () => {
    expect(isFreePreviewChapter({ tag: "Học thử miễn phí" })).toBe(true);
    expect(isFreePreviewChapter({ tag: "Học thử" })).toBe(true);
    expect(isFreePreviewChapter({ tag: "miễn phí" })).toBe(true);
    expect(isFreePreviewChapter({ tag: "Free trial" })).toBe(true);
  });

  it("matches chapter is_free_preview (Directus INT 0/1)", () => {
    expect(isFreePreviewChapter({ is_free_preview: true })).toBe(true);
    expect(isFreePreviewChapter({ is_free_preview: 1 })).toBe(true);
    expect(isFreePreviewChapter({ is_free_preview: 0, tag: null })).toBe(false);
  });

  it("rejects unrelated / empty", () => {
    expect(isFreePreviewChapter({ tag: "" })).toBe(false);
    expect(isFreePreviewChapter({})).toBe(false);
    expect(isFreePreviewChapter(null)).toBe(false);
    expect(isFreePreviewChapter({ tag: "Khóa học nâng cao" })).toBe(false);
  });
});

describe("completed exercise count (free quota — mirror mobile exerciseStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts at zero", () => {
    expect(getCompletedExerciseCount()).toBe(0);
  });

  it("increments per completed exercise", () => {
    expect(incrementCompletedExerciseCount()).toBe(1);
    expect(incrementCompletedExerciseCount()).toBe(2);
    expect(getCompletedExerciseCount()).toBe(2);
  });

  it("resets to zero", () => {
    incrementCompletedExerciseCount();
    resetCompletedExerciseCount();
    expect(getCompletedExerciseCount()).toBe(0);
  });
});
