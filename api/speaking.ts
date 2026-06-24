import apiInstance from "@/api/authConfig";
import { graphqlRequest } from "@/api/graphql/client";
import {
  GET_ALL_SPEAKING_SCENARIOS_QUERY,
  GET_SPEAKING_CATEGORIES_QUERY,
  GET_SPEAKING_DIALOGUES_QUERY,
  GET_SPEAKING_MODULES_QUERY,
} from "@/api/graphql/documents";

export const speakingApi = {
  getSpeakingModules: async () => {
    const response = await graphqlRequest<{ speaking_topics: any[] }>(GET_SPEAKING_MODULES_QUERY);
    return response.data.speaking_topics;
  },

  getSpeakingCategories: async (moduleId: string) => {
    const response = await graphqlRequest<{ speaking_scenarios: any[] }, any>(
      GET_SPEAKING_CATEGORIES_QUERY,
      { moduleId },
    );
    return response.data.speaking_scenarios;
  },

  getConversation: async (categoryId: string) => {
    const response = await graphqlRequest<{ speaking_dialogues: any[] }, any>(
      GET_SPEAKING_DIALOGUES_QUERY,
      { categoryId },
    );
    return response.data.speaking_dialogues;
  },

  getAllSpeakingScenarios: async () => {
    const response = await graphqlRequest<{ speaking_scenarios: any[] }>(
      GET_ALL_SPEAKING_SCENARIOS_QUERY,
    );
    return response.data.speaking_scenarios;
  },
};
