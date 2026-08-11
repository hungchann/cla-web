import { describe, it, expect } from "vitest";
import { BilingualMapper } from "@/lib/mappers/bilingualMapper";
import { RAW_SECTION, BILINGUAL_ITEM } from "@/tests/mocks/fixtures/bilingual";

describe("BilingualMapper.toBilingualItem", () => {
  it("maps all fields correctly", () => {
    expect(BilingualMapper.toBilingualItem(RAW_SECTION)).toEqual(BILINGUAL_ITEM);
  });

  it("handles missing image gracefully", () => {
    const section = { ...RAW_SECTION, image: null };
    const item = BilingualMapper.toBilingualItem(section);
    expect(item.image).toEqual({ uri: undefined });
  });

  it("handles missing genre as empty array", () => {
    const section = { ...RAW_SECTION, genre_id: null };
    const item = BilingualMapper.toBilingualItem(section);
    expect(item.genre).toEqual([]);
  });

  it("uses empty string when date_created missing", () => {
    const section = { ...RAW_SECTION, date_created: null };
    const item = BilingualMapper.toBilingualItem(section);
    expect(item.date).toBe("");
  });

  it("uses empty string when level missing", () => {
    const section = { ...RAW_SECTION, level: null };
    const item = BilingualMapper.toBilingualItem(section);
    expect(item.level).toBe("");
  });
});

describe("BilingualMapper.parseAggregatedCount", () => {
  it("extracts count.id from meta object", () => {
    const meta = [{ count: { id: 42 } }];
    expect(BilingualMapper.parseAggregatedCount(meta)).toBe(42);
  });

  it("extracts aggregate.count from meta object", () => {
    const meta = [{ aggregate: { count: 7 } }];
    expect(BilingualMapper.parseAggregatedCount(meta)).toBe(7);
  });

  it("returns null for null/undefined input", () => {
    expect(BilingualMapper.parseAggregatedCount(null)).toBeNull();
    expect(BilingualMapper.parseAggregatedCount(undefined)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(BilingualMapper.parseAggregatedCount("bad")).toBeNull();
    expect(BilingualMapper.parseAggregatedCount(42)).toBeNull();
  });

  it("returns null when count structure is missing", () => {
    expect(BilingualMapper.parseAggregatedCount([{ foo: "bar" }])).toBeNull();
  });
});
