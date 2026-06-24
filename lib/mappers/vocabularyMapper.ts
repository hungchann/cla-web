import { StandardVocabulary, StandardSense } from "../interfaces/vocabulary";

export class VocabularyMapper {
  /**
   * Chuyển đổi dữ liệu từ API Dictionary (vocabularyApi) sang định dạng chuẩn
   */
  static fromDictionary(response: any, levelName?: string, topicName?: string): StandardVocabulary {
    if (!response) return null as any;

    return {
      id: response.id,
      word: response.word,
      pinyin: response.pinyin,
      levelName: levelName,
      topicName: topicName,
      senses: (response.senses || []).map(
        (s: any): StandardSense => ({
          id: s.id,
          pos_label: s.pos_label,
          meaning: s.meaning_vi || s.meaning,
          examples: (s.examples || []).map((ex: any, idx: number) => ({
            id: `${s.id}-${idx}`,
            chinese: ex.chinese,
            pinyin: ex.pinyin,
            vietnamese: ex.p_vi || ex.vietnamese || "",
          })),
        }),
      ),
    };
  }

  /**
   * Chuyển đổi dữ liệu từ bài học Bilingual (bilingualApi) sang định dạng chuẩn
   */
  static fromBilingual(data: any): StandardVocabulary {
    if (!data) return null as any;

    return {
      id: data.id,
      word: data.word,
      pinyin: data.pinyin,
      // Bilingual thường không truyền level/topic trực tiếp trong item
      senses: (data.meanings || data.senses || []).map(
        (m: any): StandardSense => ({
          id: m.id,
          pos_label: m.pos_label,
          meaning: m.meaning || m.meaning_vi,
          examples: (m.examples || []).map((ex: any) => ({
            id: ex.id,
            chinese: ex.chinese,
            pinyin: ex.pinyin,
            vietnamese: ex.vietnamese || ex.p_vi || "",
          })),
        }),
      ),
    };
  }
}
