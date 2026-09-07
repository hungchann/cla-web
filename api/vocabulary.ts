import apiInstance from "@/api/authConfig";
import { DictionaryTopic } from "@/lib/types/bilingual";
import {
  ADD_NOTE_TO_VOCAB_FLOW_PATH,
  API_URL,
  UPDATE_NOTE_VOCAB_FLOW_PATH,
  VOCAB_DETAIL_FLOW_PATH,
} from "@/lib/constants";
import { graphqlRequest } from "@/api/graphql/client";
import {
  GET_DICTIONARY_LEVELS_QUERY,
  GET_TOPICS_BY_LEVEL_QUERY,
  GET_VOCABS_BY_TOPIC_AND_LEVEL_QUERY,
  GET_VOCABULARY_BY_CATEGORY_AND_TOPIC_QUERY,
} from "@/api/graphql/documents";
import { getUser } from "./apiService";
import { logger } from "@/services/logger";

export const vocabularyApi = {
  getDictionaryLevels: async (): Promise<any[]> => {
    try {
      const response = await graphqlRequest<{ dictionary_levels: any[] }>(
        GET_DICTIONARY_LEVELS_QUERY,
      );
      return response.data.dictionary_levels;
    } catch (error) {
      logger.error("Error fetching topics:", error);
      throw new Error("Failed to fetch topics");
    }
  },

  getListTopicByIdLevel: async (levelId: string): Promise<DictionaryTopic[]> => {
    try {
      const response = await graphqlRequest<{ vocab_display_map: DictionaryTopic[] }, any>(
        GET_TOPICS_BY_LEVEL_QUERY,
        { levelId },
      );
      return response.data.vocab_display_map;
    } catch (error) {
      logger.error("Error fetching topics:", error);
      throw new Error("Failed to fetch topics");
    }
  },

  getListVocabByTopicIdAndLevelId: async (topicId: string, levelId: string): Promise<any[]> => {
    logger.debug("topicId", topicId);
    logger.debug("levelId", levelId);
    try {
      const response = await graphqlRequest<{ vocab_display_map_vocab_items: any[] }, any>(
        GET_VOCABS_BY_TOPIC_AND_LEVEL_QUERY,
        {
          topicId,
          levelId,
        },
      );
      return response.data.vocab_display_map_vocab_items;
    } catch (error) {
      logger.error("Error fetching vocabulary:", error);
      throw new Error("Failed to fetch vocabulary");
    }
  },

  /**
   * Lấy chi tiết các tầng nghĩa, từ loại, ví dụ và GIF cho một danh sách vocab_items.
   */
  getVocabDetailsForItems: async (vocabItems: any[]): Promise<any[]> => {
    if (!vocabItems || vocabItems.length === 0) return [];
    try {
      const cleanItems = vocabItems
        .map((v) => (v.vocab_items_id ? v.vocab_items_id : v))
        .filter((v) => v && (v.id || v.name));

      if (cleanItems.length === 0) return [];

      const itemIds = cleanItems.map((v: any) => v.id).filter(Boolean).join(",");
      if (!itemIds) return cleanItems;

      const meaningsRes = await apiInstance.get(
        `/items/vocab_meanings?filter[item_id][_in]=${itemIds}&fields=id,meaning_vi,pos_id.id,pos_id.label_vi,item_id.id`,
      );
      const meanings: any[] = meaningsRes.data?.data || [];

      const meaningIds = meanings.map((m: any) => m.id).join(",");
      let examples: any[] = [];
      if (meaningIds) {
        const examplesRes = await apiInstance.get(
          `/items/vocab_examples?filter[meaning_id][_in]=${meaningIds}&fields=id,chinese,pinyin,p_vi,meaning_id.id`,
        );
        examples = examplesRes.data?.data || [];
      }

      const examplesByMeaningId: Record<string, any[]> = {};
      for (const ex of examples) {
        const mId = String(ex.meaning_id?.id || "");
        if (!mId) continue;
        if (!examplesByMeaningId[mId]) examplesByMeaningId[mId] = [];
        examplesByMeaningId[mId].push(ex);
      }

      const meaningsByItemId: Record<string, any[]> = {};
      for (const m of meanings) {
        const itemId = String(m.item_id?.id || "");
        if (!itemId) continue;
        if (!meaningsByItemId[itemId]) meaningsByItemId[itemId] = [];
        meaningsByItemId[itemId].push({
          ...m,
          examples: examplesByMeaningId[String(m.id)] || [],
        });
      }

      return cleanItems.map((item: any) => {
        const itemMeanings = meaningsByItemId[String(item.id)] || [];
        const gifId = item.gif_id;
        const gifUrl = gifId
          ? typeof gifId === "string"
            ? `${API_URL}/assets/${gifId}`
            : gifId.filename_disk
            ? `${API_URL}/assets/${gifId.filename_disk}`
            : gifId.id
            ? `${API_URL}/assets/${gifId.id}`
            : undefined
          : undefined;
        const gifUrls = (item.gifs || [])
          .map((f: any) => {
            const fid =
              typeof f?.directus_files_id === "object"
                ? f?.directus_files_id?.id
                : f?.directus_files_id;
            return fid ? `${API_URL}/assets/${fid}` : undefined;
          })
          .filter(Boolean);

        return {
          id: item.id,
          word: item.name || item.word || "",
          pinyin: item.pinyin || "",
          note: item.note || "",
          gif_id: typeof gifId === "object" ? gifId?.id : gifId,
          gif_url: gifUrl,
          gif_urls: gifUrls.length > 0 ? gifUrls : undefined,
          senses: itemMeanings.map((m: any) => ({
            id: m.id,
            pos_label: m.pos_id?.label_vi || undefined,
            meaning: m.meaning_vi || "",
            examples: (m.examples || []).map((ex: any) => ({
              id: ex.id,
              chinese: ex.chinese,
              pinyin: ex.pinyin,
              vietnamese: ex.p_vi,
            })),
          })),
        };
      });
    } catch (error) {
      logger.error("Error fetching vocabulary details for items:", error);
      return vocabItems;
    }
  },

  /**
   * Lấy danh sách từ vựng + nghĩa + ví dụ của một "bài học từ vựng" (Lý thuyết)
   * thông qua vocab_display_map (sử dụng junction table vocab_display_map_vocab_items).
   */
  getVocabByDisplayMap: async (
    displayMapIdOrParams: string | number | { displayMapId?: string | number; lessonId?: string | number; lesson_id?: string | number }
  ): Promise<any[]> => {
    try {
      let displayMapId: string | number | undefined;
      if (typeof displayMapIdOrParams === "object" && displayMapIdOrParams !== null) {
        if (displayMapIdOrParams.displayMapId) {
          displayMapId = displayMapIdOrParams.displayMapId;
        } else {
          const lId = displayMapIdOrParams.lessonId || displayMapIdOrParams.lesson_id;
          if (lId) {
            const theoryRes = await apiInstance.get(
              `/items/lesson_theory?filter[lesson_id][_eq]=${lId}&filter[status][_eq]=published&limit=1&fields=vocab_display_map_id`
            );
            const rawMapId = theoryRes.data?.data?.[0]?.vocab_display_map_id;
            displayMapId = typeof rawMapId === "object" ? rawMapId?.id : rawMapId;
          }
        }
      } else {
        displayMapId = displayMapIdOrParams;
      }

      if (!displayMapId) return [];

      // Lấy junction items để lấy vocab items
      const itemsRes = await apiInstance.get(
        `/items/vocab_display_map_vocab_items?filter[vocab_display_map_id][_eq]=${displayMapId}&fields=id,vocab_items_id.id,vocab_items_id.name,vocab_items_id.pinyin,vocab_items_id.note,vocab_items_id.gif_id,vocab_items_id.gifs.directus_files_id.id`,
      );
      const rawItems: any[] = itemsRes.data?.data || [];
      const vocabItems = rawItems
        .map((r: any) => r.vocab_items_id)
        .filter((v: any) => v && v.id);

      if (vocabItems.length === 0) return [];

      return vocabularyApi.getVocabDetailsForItems(vocabItems);
    } catch (error) {
      logger.error("Error fetching vocabulary by display map:", error);
      return [];
    }
  },

  getDetailVocabulary: async (idVocab: string): Promise<any[]> => {
    await getUser();
    try {
      const response = await apiInstance.get(VOCAB_DETAIL_FLOW_PATH, {
        params: { id: idVocab },
      });
      logger.debug("response", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error fetching vocabulary details:", error);
      return [];
    }
  },

  //updateNoteVocab
  updateNoteVocab: async (vocabularyId: string, note: string) => {
    logger.debug("vocabularyId", vocabularyId);
    logger.debug("note", note);
    const user = await getUser();
    logger.debug("user", user.profile.id);
    const response = await apiInstance.post(UPDATE_NOTE_VOCAB_FLOW_PATH, {
      userId: user.profile.id,
      vocabId: vocabularyId,
      note: note,
    });
    return response.data;
  },

  getVocabularyByCategoryAndTopic: async (categoryId: string, topic_id: string) => {
    try {
      await getUser();
      // // console.log("user", user);
      // console.log(categoryId, topic_id);

      const response = await graphqlRequest<{ vocabulary: any[] }, any>(
        GET_VOCABULARY_BY_CATEGORY_AND_TOPIC_QUERY,
        {
          categoryId,
          topicId: topic_id,
        },
      );

      return response.data.vocabulary;
    } catch (error) {
      logger.error("Error fetching vocabulary:", error);
      throw new Error("Failed to fetch vocabulary");
    }
  },

  addNoteToVocabulary: async (vocabularyId: string, note: string) => {
    try {
      const user = await getUser();
      // console.log("vocabularyId", vocabularyId);
      // console.log("note", note);
      // console.log("user", user.profile.id);

      const response = await apiInstance.post(ADD_NOTE_TO_VOCAB_FLOW_PATH, {
        vocabulary_id: vocabularyId,
        note: note,
        user_id: user.profile.id,
      });

      return response.data;
    } catch (error) {
      logger.error("Error adding note to vocabulary:", error);
      throw new Error("Failed to add note to vocabulary");
    }
  },
};
