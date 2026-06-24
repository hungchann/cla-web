import apiInstance from "@/api/authConfig";
import { graphqlRequestSystem } from "@/api/graphql/client";
import { DELETE_USER_SYSTEM_MUTATION } from "@/api/graphql/documents";
import { logger } from "@/services/logger";

export const userApi = {
  getCurrentUser: async () => {
    try {
      const response = await apiInstance.get("/user/me");
      return response.data;
    } catch (error) {
      logger.error("Error getting current user:", error);
      return null;
    }
  },

  updateTopicsOfInterest: async (topics: number[], userId: string) => {
    try {
      const response = await apiInstance.put(`/user/${userId}/topics`, { topics });
      return response.data;
    } catch (error) {
      logger.error("Error updating topics:", error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await graphqlRequestSystem<{ delete_users_item: { id: string } }, any>(
        DELETE_USER_SYSTEM_MUTATION,
        { id: userId },
      );
      return response.data.delete_users_item;
    } catch (error: any) {
      // Surface GraphQL error details when available
      const serverMessage =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.error ||
        error?.message;
      logger.error("Error deleting user:", error?.response?.data || error);
      throw new Error(serverMessage || "Delete user failed");
    }
  },
};
