export interface BilingualImage {
  id: string;
  title: string;
  filename_disk: string;
  created_on: string;
  description: string | null;
  filename_download: string;
}

export interface BilingualFile {
  id: string;
  title: string;
  filename_disk: string;
  created_on: string;
  description: string | null;
  filename_download: string;
}

export interface BilingualTopic {
  id: string;
  title: string;
}

export interface BilingualItem {
  id: string;
  titleCN: string;
  titleVN: string;
  date: string;
  genre: BilingualGenreLink[];
  level: string;
  image: {
    uri: string;
  };
}

export interface BilingualGenreLink {
  genre_of_section_id: {
    id: string;
    title: string;
  };
}

export interface BilingualVocabulary {
  chinese: string;
  vietnamese: string;
  pinyin: string;
}

export interface BilingualCategory {
  id: string;
  title: string;
  title_trans: string;
  date_created: string;
  date_updated: string;
  topic_id: BilingualVocabTopicLink[];
}

export interface BilingualVocabTopicLink {
  id: string;
  topic_of_vocab_id: {
    id: string;
    title: string;
    title_trans: string;
  };
}

export type QuestionResult = {
  questionId: number;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  status: string;
  explanation: string;
};

export interface DictionaryTopic {
  id: string;
  topic_id: {
    id: string;
    name: string;
    chinese_name: string;
  };
}

export interface DictionaryLevel {
  id: string;
  level_id: {
    id: string;
    name: string;
  };
  topic_id: {
    id: string;
    name: string;
  }[];
}
