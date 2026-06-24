import { graphqlRequest } from "@/api/graphql/client";
import {
  CREATE_USER_READING_PROGRESS_MUTATION,
  DELETE_USER_READING_PROGRESS_MUTATION,
  GET_ALL_BOOKS_QUERY,
  GET_BOOK_GENRES_QUERY,
  GET_BOOK_GENRES_WITH_BOOKS_QUERY,
  GET_BOOK_LIBRARY_BY_ID_QUERY,
  GET_BOOKS_BY_GENRE_ID_QUERY,
  GET_LATEST_BOOKS_QUERY,
  GET_POPULAR_BOOKS_QUERY,
  GET_TRENDING_BOOKS_QUERY,
  UPDATE_USER_READING_PROGRESS_MUTATION,
  USER_READING_PROGRESS_EXIST_QUERY,
} from "@/api/graphql/documents";
import { StoriesMapper } from "@/lib/mappers/storiesMapper";
import { getUser } from "./apiService";
import { logger } from "@/services/logger";

//lay sach chi tiet dua theo id sach
export async function getBookLibraryById(id: string): Promise<any> {
  try {
    const response = await graphqlRequest<{ book_library: any[] }, any>(
      GET_BOOK_LIBRARY_BY_ID_QUERY,
      { id },
    );

    return response.data.book_library[0];
  } catch (error) {
    logger.error("Error fetching book library:", error);
    throw error;
  }
}
// Lấy danh sách thể loại sách
export async function getBookGenres(): Promise<any> {
  try {
    const response = await graphqlRequest<{ book_genre: any[] }>(GET_BOOK_GENRES_QUERY);
    return response.data.book_genre;
  } catch (error) {
    logger.error("Error fetching book genres:", error);
    throw error;
  }
}
//Lấy danh sách sách theo thể loại
export async function getBookGenresWithBooks(): Promise<any> {
  try {
    const response = await graphqlRequest<{ book_library_book_genre: any[] }>(
      GET_BOOK_GENRES_WITH_BOOKS_QUERY,
    );
    return response.data.book_library_book_genre;
  } catch (error) {
    logger.error("Error fetching book genres with books:", error);
    throw error;
  }
}

//Lấy danh sách sách theo thể loại
export async function getBooksByGenreId(genreId: string): Promise<any> {
  try {
    const response = await graphqlRequest<{ book_library_book_genre: any[] }, any>(
      GET_BOOKS_BY_GENRE_ID_QUERY,
      { genreId },
    );
    return response.data.book_library_book_genre;
  } catch (error) {
    logger.error("Error fetching books by genre:", error);
    throw error;
  }
}

// Lấy thể loại ngẫu nhiên có sách
export async function getRandomGenresWithBooks(): Promise<any> {
  try {
    const response = await graphqlRequest<{ book_library_book_genre: any[] }>(
      GET_BOOK_GENRES_WITH_BOOKS_QUERY,
    );

    const data = response.data.book_library_book_genre;

    // Use Mapper to group and sort books by genre
    const genresWithBooks = StoriesMapper.groupBooksByGenre(data);

    // Random and lấy 4 thể loại
    const shuffled = genresWithBooks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  } catch (error) {
    logger.error("Error fetching random genres with books:", error);
    throw error;
  }
}

// Lấy sách mới nhất
export async function getLatestBooks(): Promise<any> {
  try {
    const response = await graphqlRequest<{ book_library: any[] }>(GET_LATEST_BOOKS_QUERY);
    return response.data.book_library;
  } catch (error) {
    logger.error("Error fetching latest books:", error);
    throw error;
  }
}

//Lấy 5 sách đang thịnh hành
export const getTrendingBooks = async () => {
  try {
    const response = await graphqlRequest<{ book_library: any[] }>(GET_TRENDING_BOOKS_QUERY);
    const data = response.data.book_library;
    const popularBooks = data.filter((book: any) => book.popular);
    return popularBooks;
  } catch (error) {
    logger.error("Error fetching trending books:", error);
    return [];
  }
};

//Lấy 5 sách ngẫu nhiên (có thể bạn sẽ thích)
export const getRandomBooks = async () => {
  try {
    const response = await graphqlRequest<{ book_library: any[] }>(GET_ALL_BOOKS_QUERY);
    const allBooks = response.data.book_library;
    const shuffled = [...allBooks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  } catch (error) {
    logger.error("Error fetching random books:", error);
    return [];
  }
};

// ... existing code ...
//Hien thị tiến trình đọc sách
export const getReadingProgress = async () => {
  try {
    const response = await graphqlRequest<{ book_library: any[] }>(GET_POPULAR_BOOKS_QUERY);
    return response.data.book_library;
  } catch (error) {
    logger.error("Error fetching reading progress:", error);
    throw error;
  }
};

// Lưu tiến độ đọc sách
export const saveReadingProgress = async (
  bookId: string,
  chapterId: number,
  progressPercentage: number,
) => {
  // Kiểm tra input parameters
  if (!bookId || !chapterId || !progressPercentage) {
    logger.error("Invalid parameters for saveReadingProgress:", {
      bookId,
      chapterId,
      progressPercentage,
    });
    throw new Error("Invalid parameters for saving reading progress");
  }

  const user = await getUser();
  const userId = user.profile.id;
  logger.debug("userId", userId);
  logger.debug("bookId", bookId);
  logger.debug("chapterId", chapterId);
  logger.debug("progressPercentage", progressPercentage);
  //Kiem tra xem tồn tại chưa ?
  const response = await graphqlRequest<{ User_Reading_Progress: any[] }, any>(
    USER_READING_PROGRESS_EXIST_QUERY,
    {
      userId,
      bookId,
    },
  );
  const data = response.data.User_Reading_Progress;
  if (data.length > 0) {
    logger.debug("Đã tồn tại, SaveReadingProgress");
    //Cập nhật tiến độ đọc sách
    logger.debug("data", data);
    //lay ra id
    const responseUpdate = await graphqlRequest<
      { update_User_Reading_Progress_items: { id: string }[] },
      any
    >(UPDATE_USER_READING_PROGRESS_MUTATION, {
      ids: [data[0].id],
      chapter: Math.floor(chapterId),
      decimal: Math.floor(progressPercentage),
    });
    return { data: responseUpdate.data };
  } else {
    logger.debug("Chưa tồn tại, SaveReadingProgress");
    const responseCreate = await graphqlRequest<
      { create_User_Reading_Progress_item: { id: string } },
      any
    >(CREATE_USER_READING_PROGRESS_MUTATION, {
      userId: userId,
      bookId: bookId,
      chapter: Math.floor(chapterId),
      decimal: Math.floor(progressPercentage),
    });
    return { data: responseCreate.data };
  }
};

export const deleteReadingProgress = async (bookId: string) => {
  try {
    const user = await getUser();
    const userId = user.profile.id;

    const responseExist = await graphqlRequest<{ User_Reading_Progress: { id: string }[] }, any>(
      USER_READING_PROGRESS_EXIST_QUERY,
      {
        userId,
        bookId,
      },
    );
    const data = responseExist.data.User_Reading_Progress;
    if (data.length > 0) {
      //lay ra id
      const id = data[0].id;

      if (!id) {
        return { deleted: false };
      }

      const deleteResponse = await graphqlRequest<
        { delete_User_Reading_Progress_item: { id: string } },
        any
      >(DELETE_USER_READING_PROGRESS_MUTATION, { id: id });
      return { data: deleteResponse.data };
    } else {
      logger.debug("Chưa tồn tại, deleteReadingProgress");
    }
  } catch (error) {
    logger.error("Error deleting reading progress:", error);
    throw error;
  }
};
