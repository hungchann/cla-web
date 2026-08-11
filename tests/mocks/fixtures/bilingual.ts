import { BilingualItem } from "@/lib/types/bilingual";

export const RAW_SECTION = {
  id: "srv-01",
  title: "Bắc Kinh",
  title_trans: "Bắc Kinh",
  image: { filename_disk: "image-beijing.jpg" },
  date_created: "2024-01-01T00:00:00.000Z",
  genre_id: [
    { genre_of_section_id: { id: "g-01", title: "Văn hóa" } },
  ],
  level: "HSK 4",
};

export const BILINGUAL_ITEM: BilingualItem = {
  id: "srv-01",
  titleCN: "Bắc Kinh",
  titleVN: "Bắc Kinh",
  image: { uri: "image-beijing.jpg" },
  date: "2024-01-01T00:00:00.000Z",
  genre: [{ genre_of_section_id: { id: "g-01", title: "Văn hóa" } }],
  level: "HSK 4",
};
