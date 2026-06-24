export interface VocabularyItem {
  id: string;
  word: string;
  pinyin: string;
  note?: string;
  meanings: MeaningType[];
}

export interface MeaningType {
  type: string;
  meanings: Meaning[];
}

export interface Meaning {
  id: number;
  meaning: string;
  examples: Example[];
}

export interface Example {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

// Standardized interfaces for shared components
export interface StandardExample {
  id: number | string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface StandardSense {
  id: number | string;
  pos_label?: string;
  meaning: string;
  examples: StandardExample[];
}

export interface StandardVocabulary {
  id: number | string;
  word: string;
  pinyin: string;
  senses: StandardSense[];
  levelName?: string;
  topicName?: string;
}

export interface VocabularyCategory {
  id: string;
  title: string;
  date_created: string;
  topic_id: VocabularyTopic[];
}

export interface VocabularyTopic {
  id: string;
  topic_of_vocab_id: {
    id: string;
    title: string;
  };
}

export interface WordClassifier {
  word: string;
  pinyin: string;
}

export interface WordInfo {
  word: string;
  pinyin: string;
  meanings: string | string[];
  traditional?: string;
  simplified?: string;
  classifiers?: WordClassifier[];
}
