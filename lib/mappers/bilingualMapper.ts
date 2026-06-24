import { BilingualItem } from "@/lib/types/bilingual";

export class BilingualMapper {
  /**
   * Maps a raw Section object from Directus/GraphQL to a BilingualItem.
   * `date` giữ ISO / raw `date_created` (giống video) — format tại UI bằng formatDate().
   */
  static toBilingualItem(section: any): BilingualItem {
    return {
      id: section.id,
      titleCN: section.title,
      titleVN: section.title_trans,
      image: { uri: section.image?.filename_disk },
      date: section.date_created ?? "",
      genre: section.genre_id || [],
      level: section.level || "",
    };
  }

  /**
   * Parses the aggregated count from Directus meta response.
   */
  static parseAggregatedCount(meta: unknown): number | null {
    if (meta == null) return null;
    const row = Array.isArray(meta) ? meta[0] : meta;
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const countBlock = r.count as Record<string, unknown> | undefined;
    if (countBlock && typeof countBlock.id === "number") return countBlock.id;
    const agg = r.aggregate as Record<string, unknown> | undefined;
    if (agg && typeof agg.count === "number") return agg.count;
    return null;
  }
}
