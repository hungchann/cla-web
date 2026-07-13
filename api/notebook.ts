import apiInstance from "@/api/authConfig";
import { graphqlRequest } from "@/api/graphql/client";
import {
  CREATE_FLASHCARD_DECK_MUTATION,
  CREATE_FLASHCARD_ITEM_MUTATION,
  CREATE_USER_FLASHCARD_MUTATION,
  CREATE_VOCAB_ITEM_MUTATION,
  GET_DICTIONARY_LEVELS_QUERY,
  GET_PERSONAL_FLASHCARD_DECKS_QUERY,
  GET_TOPICS_BY_LEVEL_QUERY,
  GET_USER_FLASHCARD_PROGRESS_QUERY,
  GET_VOCABS_BY_TOPIC_AND_LEVEL_QUERY,
  UPDATE_USER_FLASHCARD_STATUS_MUTATION,
  USER_FLASHCARD_EXIST_QUERY,
  GET_VOCAB_BY_NAME_QUERY,
} from "@/api/graphql/documents";
import { FLASHCARD_DECK_VOCABS_FLOW_PATH, VOCAB_DETAIL_FLOW_PATH } from "@/lib/constants";
import { getUser } from "./apiService";
import { logger } from "@/services/logger";

export const notebookApi = {
  //Phần này hiển thị giống như phần dictionary
  getNoteBooks: async () => {
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

  createNoteBooks: async (title: string) => {
    try {
      const user = await getUser();
      // console.log("user", user);
      // console.log("title", title);
      const response = await graphqlRequest<{ create_flashcard_deck_item: any }, any>(
        CREATE_FLASHCARD_DECK_MUTATION,
        {
          userId: user.profile?.id,
          title,
        },
      );
      const created = response.data?.create_flashcard_deck_item;
      // console.log("created flashcard deck item:", created);
      return created;
    } catch (error: any) {
      if (error && error.response && error.response.data) {
        logger.error("Error creating flashcard deck item:", error.response.data);
      } else {
        logger.error("Error creating flashcard deck item:", error);
      }
    }
  },

  getPersonalNotebooks: async () => {
    const user = await getUser();
    try {
      const response = await graphqlRequest<{ flashcard_deck: any[] }, any>(
        GET_PERSONAL_FLASHCARD_DECKS_QUERY,
        {
          userId: user.profile?.id,
        },
      );
      return response.data.flashcard_deck;
    } catch (error) {
      logger.error("Error fetching personal notebooks:", error);
      throw new Error("Failed to fetch personal notebooks");
    }
  },

  getCategoryByNotebookId: async (notebookId: string) => {
    try {
      const response = await graphqlRequest<{ vocab_display_map: any[] }, any>(
        GET_TOPICS_BY_LEVEL_QUERY,
        { levelId: notebookId },
      );
      return response.data.vocab_display_map;
    } catch (error) {
      logger.error("Error fetching topics:", error);
      throw new Error("Failed to fetch topics");
    }
  },

  getListVocabByTopicIdAndLevelIdNotebook: async (
    topicId: string,
    levelId: string,
  ): Promise<any[]> => {
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

  getDetailVocabularyNotebook: async (idVocab: string): Promise<any[]> => {
    //Lay user tu secureStore
    // const user = await getUser();
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

  addVocabularyToNotebook: async (vocabularyId: string, notebookId: string) => {
    logger.debug("vocabularyId", vocabularyId);
    logger.debug("notebookId", notebookId);
    try {
      const response = await graphqlRequest<{ create_flashcard_item_item: any }, any>(
        CREATE_FLASHCARD_ITEM_MUTATION,
        {
          vocabId: vocabularyId,
          deckId: notebookId,
        },
      );
      return response.data.create_flashcard_item_item;
    } catch (error) {
      logger.error("Error adding vocabulary to notebook:", error);
      throw new Error("Failed to add vocabulary to notebook");
    }
  },

  getListVocabByIdFlashcardDeck: async (flashcardDeckId: string): Promise<any[]> => {
    try {
      const user = await getUser();

      const response = await apiInstance.get(FLASHCARD_DECK_VOCABS_FLOW_PATH, {
        params: { id: flashcardDeckId, userId: user.profile.id },
      });
      logger.debug("response", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error fetching vocabulary:", error);
      throw new Error("Failed to fetch vocabulary");
    }
  },

  //cập nhật Progress Flashcard
  updateVocabProgress: async (
    sourceType: "system" | "personal",
    flashcardDeckId: string | null,
    vocabularyId: string | null,
    status: string,
    flashcardItemId?: string | null,
  ) => {
    const user = await getUser();
    try {
      // Build identifying filter for existence check (as GraphQL variable)
      let filter: any = {};
      if (sourceType === "system" && vocabularyId) {
        filter = { dictionary_vocab_id: { _eq: vocabularyId } };
      } else if (flashcardItemId) {
        filter = { flashcard_item_id: { _eq: flashcardItemId } };
      } else if (flashcardDeckId) {
        filter = { deck_id: { _eq: flashcardDeckId } };
      }

      const existRes = await graphqlRequest<
        { UserFlashcard: { id: string; status: string }[] },
        any
      >(USER_FLASHCARD_EXIST_QUERY, {
        userId: user.profile.id,
        filter,
      });
      const existing = existRes.data?.UserFlashcard ?? [];

      if (existing.length > 0) {
        const targetId = existing[0].id;
        const updateRes = await graphqlRequest<
          { update_UserFlashcard_item: { id: string; status: string } },
          any
        >(UPDATE_USER_FLASHCARD_STATUS_MUTATION, {
          id: targetId,
          status,
        });
        return updateRes.data?.update_UserFlashcard_item;
      }
      const createRes = await graphqlRequest<
        { create_UserFlashcard_item: { id: string; status: string } },
        any
      >(CREATE_USER_FLASHCARD_MUTATION, {
        userId: user.profile.id,
        status,
        dictionaryVocabId: sourceType === "system" && vocabularyId ? vocabularyId : null,
        flashcardItemId: sourceType === "personal" && flashcardItemId ? flashcardItemId : null,
        deckId: sourceType === "personal" && flashcardDeckId ? flashcardDeckId : null,
      });
      return createRes.data.create_UserFlashcard_item;
    } catch (error) {
      logger.error("Error updating vocabulary progress:", error);
      throw new Error("Failed to update vocabulary progress");
    }
  },

  getProgressVocab: async () => {
    try {
      const user = await getUser();
      if (!user?.profile?.id) {
        return [];
      }
      const response = await graphqlRequest<{ UserFlashcard: any[] }, any>(
        GET_USER_FLASHCARD_PROGRESS_QUERY,
        { userId: user.profile.id },
      );
      return response.data.UserFlashcard;
    } catch (error: any) {
      const isUnauthorized =
        error?.response?.status === 401 ||
        error?.status === 401 ||
        (error instanceof Error && error.message.includes("401"));

      if (isUnauthorized) {
        logger.debug("User is not authenticated, returning empty vocabulary progress.");
        return [];
      }

      logger.error("Error fetching vocabulary progress:", error);
      throw new Error("Failed to fetch vocabulary progress");
    }
  },

  createVocabItemInPersonalDeck: async (
    deckId: string,
    chinese: string,
    pinyin: string,
    vietnamese: string,
    exampleSentence?: string,
    exampleTranslation?: string,
  ) => {
    try {
      const safeChinese = chinese.replace(/"/g, '\\"');
      const safePinyin = pinyin.replace(/"/g, '\\"');
      const safeVietnamese = vietnamese.replace(/"/g, '\\"');
      void exampleSentence;
      void exampleTranslation;

      // 1. Kiểm tra xem từ vựng đã tồn tại trong hệ thống chưa
      let vocabItemId: string | null = null;
      try {
        const searchRes = await graphqlRequest<{ vocab_items: { id: string }[] }, any>(
          GET_VOCAB_BY_NAME_QUERY,
          { name: safeChinese }
        );
        vocabItemId = searchRes.data?.vocab_items?.[0]?.id || null;
      } catch (err) {
        logger.warn("Không thể kiểm tra sự tồn tại của từ vựng:", err);
      }

      // 2. Nếu chưa tồn tại, thử tạo mới
      if (!vocabItemId) {
        const vocabItemRes = await graphqlRequest<{ create_vocab_items_item: { id: string } }, any>(
          CREATE_VOCAB_ITEM_MUTATION,
          {
            name: safeChinese,
            pinyin: safePinyin,
            note: safeVietnamese,
          },
        );
        vocabItemId = vocabItemRes.data?.create_vocab_items_item?.id || null;
      }

      if (!vocabItemId) {
        throw new Error("Failed to create or find vocab item");
      }

      // Validate IDs to prevent GraphQL injection
      // Hỗ trợ cả định dạng UUID (chuỗi) và tự tăng (số nguyên)
      const idPattern = /^[a-zA-Z0-9-]+$/;
      if (!idPattern.test(String(vocabItemId))) {
        throw new Error("Invalid vocab item ID format");
      }
      if (!idPattern.test(String(deckId))) {
        throw new Error("Invalid deck ID format");
      }

      // Use GraphQL variables to prevent injection attacks
      const linkRes = await graphqlRequest<{ create_flashcard_item_item: any }, any>(
        CREATE_FLASHCARD_ITEM_MUTATION,
        {
          vocabId: vocabItemId,
          deckId: deckId,
        },
      );
      return linkRes.data?.create_flashcard_item_item;
    } catch (error) {
      logger.error("Error creating vocab item in personal deck:", error);
      throw new Error("Failed to create vocab item in personal deck");
    }
  },
};
