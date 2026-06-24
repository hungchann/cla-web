import apiInstance from "@/api/authConfig";
import { DictionaryTopic } from "@/lib/types/bilingual";
import {
  ADD_NOTE_TO_VOCAB_FLOW_PATH,
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

  getDetailVocabulary: async (idVocab: string): Promise<any[]> => {
    //Lay user tu secureStore
    const user = await getUser();
    // console.log("user", user);
    // console.log("idVocab", idVocab);
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
      const user = await getUser();
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
