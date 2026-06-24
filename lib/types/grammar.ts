export interface GrammarItem {
  id: string;
  title: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
}

export interface GrammarLevel {
  id: string;
  title: string;
  topics: GrammarTopic[];
}
