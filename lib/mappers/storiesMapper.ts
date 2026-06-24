export class StoriesMapper {
  /**
   * Groups book library entries by genre and sorts them by date.
   */
  static groupBooksByGenre(data: any[]): any[] {
    const genreMap = new Map();

    data.forEach((item: any) => {
      if (!item?.book_genre_id) return;

      const genreId = item.book_genre_id.id;
      const genreTitle = item.book_genre_id.title;

      if (!genreMap.has(genreId)) {
        genreMap.set(genreId, {
          id: genreId,
          title: genreTitle,
          books: [],
        });
      }

      if (item.book_library_id) {
        const entry = genreMap.get(genreId);
        if (entry && Array.isArray(entry.books)) {
          entry.books.push(item.book_library_id);
        }
      }
    });

    const genresWithBooks = Array.from(genreMap.values()).filter((genre) => genre.books.length > 0);

    // Sort books in each genre by date (descending)
    genresWithBooks.forEach((genre) => {
      genre.books.sort((a: any, b: any) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateB - dateA;
      });
    });

    return genresWithBooks;
  }
}
