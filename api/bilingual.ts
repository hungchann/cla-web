import apiInstance from "@/api/authConfig";
import { buildBilingualItemsPagedQuery } from "@/api/graphql/builders/bilingual";
import { graphqlRequest, graphqlRequestRaw } from "@/api/graphql/client";
import {
  GET_GENRE_OF_SECTION_QUERY,
  GET_GRAMMAR_OF_SECTION_QUERY,
  GET_HSK_LEVELS_QUERY,
  GET_NEW_VIDEOS_QUERY,
  GET_SECTION_BY_ID_QUERY,
  GET_VIDEO_SECTIONS_QUERY,
} from "@/api/graphql/documents";
import {
  ADD_NOTE_TO_VOCAB_FLOW_PATH,
  EXERCISE_BY_ID_FLOW_PATH,
  SUBMIT_EXERCISE_FLOW_PATH,
  UPDATE_TOPICS_OF_INTEREST_FLOW_PATH,
} from "@/lib/constants";
import { BilingualItem } from "@/lib/types/bilingual";

import { BilingualMapper } from "@/lib/mappers/bilingualMapper";
import { VideoSection } from "@/lib/types/types";
import { logger } from "@/services/logger";

// selection moved to api/graphql/builders/bilingualSelection.ts

function escapeGraphQLString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, String.raw`\"`);
}

/** Filter Directus cho list + aggregate (cùng điều kiện để total khớp trang). */
function buildSectionsFilterParts(
  level?: string,
  topicTitle?: string,
): {
  listSuffix: string;
  aggregateArgs: string;
} {
  const parts: string[] = [];
  const lv = level?.trim();
  const tp = topicTitle?.trim();
  if (lv) parts.push(`{ level: { _eq: "${escapeGraphQLString(lv)}" } }`);
  if (tp)
    parts.push(
      `{ genre_id: { _some: { genre_of_section_id: { title: { _eq: "${escapeGraphQLString(tp)}" } } } } }`,
    );
  if (parts.length === 0) return { listSuffix: "", aggregateArgs: "" };
  const body = parts.length === 1 ? parts[0] : `{ _and: [ ${parts.join(", ")} ] }`;
  return {
    listSuffix: `, filter: ${body}`,
    aggregateArgs: `(filter: ${body})`,
  };
}

export type BilingualItemsPageResult = {
  items: BilingualItem[];
  totalCount: number;
};

export const bilingualApi = {
  getTopics: async (): Promise<any[]> => {
    try {
      const response = await graphqlRequest<{ genre_of_section: any[] }>(
        GET_GENRE_OF_SECTION_QUERY,
      );
      return response.data.genre_of_section;
    } catch (error) {
      logger.error("Error fetching topics:", error);
      throw new Error("Failed to fetch topics");
    }
  },

  updateTopicsOfInterest: async (topics: string[], user_id: string): Promise<void> => {
    try {
      const response = await apiInstance.post(
        UPDATE_TOPICS_OF_INTEREST_FLOW_PATH,
        {
          id: topics,
        },
        {
          params: { id: user_id },
        },
      );
      return response.data;
    } catch (error) {
      logger.error("Error updating topics of interest:", error);
      throw new Error("Failed to update topics of interest");
    }
  },
  getLevels: async (): Promise<any[]> => {
    try {
      const response = await graphqlRequest<{ hsk_level: any[] }>(GET_HSK_LEVELS_QUERY);
      return response.data.hsk_level;
    } catch (error) {
      logger.error("Error fetching levels:", error);
      throw new Error("Failed to fetch levels");
    }
  },

  /**
   * Phân trang server: limit + offset, sort -date_created.
   * Một round-trip: list + Sections_aggregated.count (Directus).
   */
  getBilingualItemsPaged: async (params: {
    limit: number;
    offset: number;
    level?: string;
    topicTitle?: string;
  }): Promise<BilingualItemsPageResult> => {
    const { limit, offset, level, topicTitle } = params;
    const { listSuffix, aggregateArgs } = buildSectionsFilterParts(level, topicTitle);

    const query = buildBilingualItemsPagedQuery({
      limit,
      offset,
      listSuffix,
      aggregateArgs,
    });

    try {
      const response = await graphqlRequestRaw<any>(query);
      const payload = (response as any)?.data;
      if (!payload) {
        throw new Error("Invalid GraphQL response");
      }

      const rawList = payload.list ?? [];
      const items = (Array.isArray(rawList) ? rawList : []).map(BilingualMapper.toBilingualItem);

      let totalCount = BilingualMapper.parseAggregatedCount(payload.meta);
      if (totalCount == null) {
        logger.warn("[bilingual] Sections_aggregated count missing; totalCount fallback");
        totalCount = items.length < limit ? offset + items.length : offset + items.length + 1;
      }

      return { items, totalCount };
    } catch (error) {
      logger.error("Error fetching bilingual items (paged):", error);
      throw new Error("Failed to fetch bilingual items");
    }
  },

  getBilingualItemById: async (id: string): Promise<any> => {
    try {
      const response = await graphqlRequest<{ Sections_by_id: any }, any>(GET_SECTION_BY_ID_QUERY, {
        id,
      });

      return response.data.Sections_by_id;
    } catch (error: any) {
      logger.error("Error fetching bilingual item:", error);
      if (error.response?.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch bilingual item");
    }
  },

  getVocabularyById: async (id: string): Promise<any> => {
    try {
      const response = await apiInstance.post(ADD_NOTE_TO_VOCAB_FLOW_PATH, {}, { params: { id } });
      return response.data;
    } catch (error: any) {
      logger.error("Error fetching vocabulary:", error);
      if (error.response?.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch vocabulary");
    }
  },

  getGrammarById: async (id: string): Promise<any> => {
    try {
      const response = await graphqlRequest<{ grammar_of_section: any[] }, any>(
        GET_GRAMMAR_OF_SECTION_QUERY,
        { id },
      );

      return response.data.grammar_of_section;
    } catch (error: any) {
      logger.error("Error fetching grammar:", error);
      if (error.response?.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch grammar");
    }
  },

  getExerciseById: async (id: string): Promise<any> => {
    try {
      const response = await apiInstance.post(
        EXERCISE_BY_ID_FLOW_PATH,
        {},
        {
          params: { id },
        },
      );

      // Kiểm tra response và trả về object rỗng nếu không có dữ liệu
      if (!response.data?.result?.[0]) {
        return {
          exercises: [],
          id: id,
          title: "",
          description: "",
        };
      }

      return response.data.result[0];
    } catch (error: any) {
      logger.error("Error fetching exercise:", error);
      if (error.response?.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch exercise");
    }
  },

  submitExercise: async (answers: any): Promise<any> => {
    try {
      const response = await apiInstance.post(SUBMIT_EXERCISE_FLOW_PATH, {
        answers,
      });
      return response.data;
    } catch (error: any) {
      logger.error("Error submitting exercise:", error);
      if (error.response?.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to submit exercise");
    }
  },

  getVideoSection: async (): Promise<VideoSection[]> => {
    try {
      const response = await graphqlRequest<{ video_section: VideoSection[] }>(
        GET_VIDEO_SECTIONS_QUERY,
      );
      return response.data.video_section;
    } catch (error: any) {
      logger.error("Error fetching video sections:", error?.message || error);
      if (error?.response) {
        logger.debug(
          "[getVideoSection] GraphQL error response:",
          JSON.stringify(error.response.data, null, 2),
        );
      }
      throw new Error("Failed to fetch video sections");
    }
  },

  getNewVideos: async (): Promise<VideoSection[]> => {
    try {
      const response = await graphqlRequest<{ video_section: VideoSection[] }>(
        GET_NEW_VIDEOS_QUERY,
      );
      return response.data.video_section;
    } catch (error: any) {
      logger.error("Error fetching new videos:", error?.message || error);
      if (error?.response) {
        logger.debug(
          "[getNewVideos] GraphQL error response:",
          JSON.stringify(error.response.data, null, 2),
        );
      }
      throw new Error("Failed to fetch new videos");
    }
  },
};
