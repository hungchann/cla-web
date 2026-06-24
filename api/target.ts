import apiInstance from "@/api/authConfig";
import { graphqlRequest } from "@/api/graphql/client";
import { GET_TARGET_USER_QUERY } from "@/api/graphql/documents";
import { UPDATE_TARGET_USER_FLOW_PATH } from "@/lib/constants";
import { logger } from "@/services/logger";

export interface TargetUser {
  id: string;
  title: string;
  description: string;
}

export const getTargetUser = async (): Promise<TargetUser[]> => {
  try {
    const response = await graphqlRequest<{ target_user: TargetUser[] }>(GET_TARGET_USER_QUERY);
    return response.data.target_user;
  } catch (error) {
    logger.error("Error fetching target user:", error);
    throw error;
  }
};

export const updateTargetUser = async (idProfile: string, targetId: number): Promise<any> => {
  try {
    const response = await apiInstance.post(UPDATE_TARGET_USER_FLOW_PATH, {
      idprofile: idProfile,
      target_id: targetId,
    });

    return response.data;
  } catch (error) {
    logger.error("Error updating target user:", error);
    throw error;
  }
};
