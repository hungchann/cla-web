import { graphqlRequest } from "@/api/graphql/client";
import { logger } from "@/services/logger";
import {
  GET_GRAMMAR_DETAIL_QUERY,
  GET_GRAMMAR_ITEMS_QUERY,
  GET_GRAMMAR_ITEMS_WITH_RELATIONS_QUERY,
  GET_GRAMMAR_MODULES_QUERY,
  GET_GRAMMAR_TOPICS_BY_MODULE_QUERY,
} from "@/api/graphql/documents";

export const grammarApi = {
  getGrammarModules: async () => {
    try {
      const response = await graphqlRequest<{ grammar_modules: any[] }>(GET_GRAMMAR_MODULES_QUERY);
      return response.data.grammar_modules;
    } catch (error) {
      logger.error("Error fetching grammar Modules:", error);
      throw new Error("Failed to fetch grammar Modules");
    }
  },

  getGrammarItems: async () => {
    try {
      const response = await graphqlRequest<{ grammar_item: any[] }>(GET_GRAMMAR_ITEMS_QUERY);
      return response.data.grammar_item;
    } catch (error) {
      logger.error("Error fetching grammar items:", error);
      throw new Error("Failed to fetch grammar items");
    }
  },

  getRandomGrammarItems: async () => {
    try {
      const response = await graphqlRequest<{ grammar_item: any[] }>(
        GET_GRAMMAR_ITEMS_WITH_RELATIONS_QUERY,
      );
      const data = response.data.grammar_item;

      // Random và lấy 4 item
      const shuffled = data.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
    } catch (error) {
      logger.error("Error fetching random grammar items:", error);
      throw new Error("Failed to fetch random grammar items");
    }
  },

  getGrammarDetailById: async (grammarModuleId: any, topicId: any) => {
    // console.log("grammarModuleId", grammarModuleId);
    // console.log("topicId", topicId);
    try {
      const response = await graphqlRequest<{ grammar_item: any[] }, any>(
        GET_GRAMMAR_DETAIL_QUERY,
        { grammarModuleId, topicId },
      );
      return response.data.grammar_item;
    } catch (error) {
      logger.error("Error fetching grammar detail:", error);
      throw new Error("Failed to fetch grammar detail");
    }
  },
  getTopicOfGrammarItem: async (moduleId: any) => {
    logger.debug("moduleId", moduleId);
    try {
      const response = await graphqlRequest<{ grammar_item: any[] }, any>(
        GET_GRAMMAR_TOPICS_BY_MODULE_QUERY,
        { moduleId },
      );
      return response.data.grammar_item;
    } catch (error) {
      logger.error("Error fetching grammar item:", error);
      throw new Error("Failed to fetch grammar item");
    }
  },
};
