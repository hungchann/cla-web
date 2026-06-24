import apiInstance from "@/api/authConfig";
import { graphqlRequest } from "@/api/graphql/client";
import { GET_VIDEO_GENRES_QUERY } from "@/api/graphql/documents";
import { logger } from "@/services/logger";

export const fetchVideoGenres = async () => {
  try {
    const response = await graphqlRequest<{ video_genre: any[] }>(GET_VIDEO_GENRES_QUERY);
    return response.data.video_genre;
  } catch (error) {
    logger.error("Error fetching video genres:", error);
    throw error;
  }
};
