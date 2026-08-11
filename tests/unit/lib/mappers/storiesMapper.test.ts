import { describe, it, expect } from "vitest";
import { StoriesMapper } from "@/lib/mappers/storiesMapper";

describe("StoriesMapper.groupBooksByGenre", () => {
  it("groups books by genre and sorts by date descending", () => {
    const data = [
      {
        book_genre_id: { id: "g-1", title: "Truyện" },
        book_library_id: { id: "b-1", date_created: "2024-01-01" },
      },
      {
        book_genre_id: { id: "g-1", title: "Truyện" },
        book_library_id: { id: "b-2", date_created: "2024-02-01" },
      },
      {
        book_genre_id: { id: "g-2", title: "Khoa học" },
        book_library_id: { id: "b-3", date_created: "2024-03-01" },
      },
    ];

    const result = StoriesMapper.groupBooksByGenre(data);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Truyện");
    expect(result[0].books.map((b: { id: string }) => b.id)).toEqual(["b-2", "b-1"]); // sorted desc
    expect(result[1].title).toBe("Khoa học");
  });

  it("skips entries without book_genre_id", () => {
    const result = StoriesMapper.groupBooksByGenre([
      { book_library_id: { id: "b-1" } },
      { book_genre_id: { id: "g-1", title: "X" }, book_library_id: { id: "b-2" } },
    ]);
    expect(result).toHaveLength(1);
  });

  it("filters out genres with no books", () => {
    const result = StoriesMapper.groupBooksByGenre([
      { book_genre_id: { id: "g-1", title: "Rỗng" } },
    ]);
    expect(result).toHaveLength(0);
  });

  it("handles empty input", () => {
    expect(StoriesMapper.groupBooksByGenre([])).toEqual([]);
  });

  it("handles missing date as 0 when sorting", () => {
    const result = StoriesMapper.groupBooksByGenre([
      {
        book_genre_id: { id: "g-1", title: "X" },
        book_library_id: { id: "b-1", date_created: "2024-01-01" },
      },
      {
        book_genre_id: { id: "g-1", title: "X" },
        book_library_id: { id: "b-2" }, // no date
      },
    ]);
    expect(result[0].books.map((b: { id: string }) => b.id)).toEqual(["b-1", "b-2"]);
  });
});
