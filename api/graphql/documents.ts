import gqlTag from "graphql-tag";

export const REFRESH_TOKEN_MUTATION = gqlTag`
  mutation Refresh($refresh_token: String!) {
    auth_refresh(refresh_token: $refresh_token, mode: json) {
      access_token
      refresh_token
      expires
    }
  }
`;

export const GET_NEW_SECTIONS_QUERY = gqlTag`
  query GetNewSections {
    Sections(sort: ["-date_created"], limit: 5) {
      id
      title
      title_trans
      image {
        id
        title
        filename_disk
        created_on
        description
        filename_download
      }
      file_script {
        id
        title
        filename_disk
        created_on
        description
        filename_download
      }
      SubRip_Subtitle {
        id
        title
        filename_disk
        created_on
        description
        filename_download
      }
      level
      genre_id {
        genre_of_section_id {
          id
          title
        }
      }
      date_created
    }
  }
`;

export const GET_ALL_VOCABULARY_QUERY = gqlTag`
  query GetAllVocabulary {
    Vocabulary {
      id
      word
      Pinyin
      word_type
      meaning
      Example
    }
  }
`;

export const GET_VOCABULARY_BY_SECTION_QUERY = gqlTag`
  query GetVocabularyBySection($idSection: GraphQLStringOrFloat!) {
    vocabulary(filter: { section_id: { _eq: $idSection } }) {
      id
      word
      Pinyin
      word_type
      meaning
      Example
    }
  }
`;

export const GET_TOPIC_OF_EXERCISE_QUERY = gqlTag`
  query GetTopicOfExercise {
    topic_of_exercise {
      id
      title
      title_trans
    }
  }
`;

export const GET_LESSONS_BY_TOPIC_ID_QUERY = gqlTag`
  query GetLessonsByTopicId($topicId: GraphQLStringOrFloat!) {
    link_exercise(
      filter: { topic_of_exercise: { id: { _eq: $topicId } } }
    ) {
      lession_id {
        id
        title
      }
    }
  }
`;

export const GET_VIDEO_GENRES_QUERY = gqlTag`
  query GetVideoGenres {
    video_genre {
      id
      title
    }
  }
`;

export const USER_FLASHCARD_EXIST_QUERY = gqlTag`
  query UserFlashcardExist($userId: GraphQLStringOrFloat!, $filter: UserFlashcard_filter!) {
    UserFlashcard(
      filter: {
        _and: [{ user_id: { id: { _eq: $userId } } }, $filter]
      }
    ) {
      id
      status
    }
  }
`;

export const UPDATE_USER_FLASHCARD_STATUS_MUTATION = gqlTag`
  mutation UpdateUserFlashcardStatus($id: ID!, $status: String!) {
    update_UserFlashcard_item(id: $id, data: { status: $status }) {
      id
      status
    }
  }
`;

export const CREATE_USER_FLASHCARD_MUTATION = gqlTag`
  mutation CreateUserFlashcard(
    $userId: ID!
    $status: String!
    $dictionaryVocabId: String
    $flashcardItemId: String
    $deckId: String
  ) {
    create_UserFlashcard_item(
      data: {
        user_id: { id: $userId }
        status: $status
        dictionary_vocab_id: $dictionaryVocabId
        flashcard_item_id: $flashcardItemId
        deck_id: $deckId
      }
    ) {
      id
      status
    }
  }
`;

export const GET_USER_FLASHCARD_PROGRESS_QUERY = gqlTag`
  query GetUserFlashcardProgress($userId: GraphQLStringOrFloat!) {
    UserFlashcard(filter: { user_id: { id: { _eq: $userId } } }) {
      id
      dictionary_vocab_id
      flashcard_item_id
      status
      deck_id
    }
  }
`;

export const CREATE_VOCAB_ITEM_MUTATION = gqlTag`
  mutation CreateVocabItem($name: String!, $pinyin: String!, $note: String!) {
    create_vocab_items_item(data: { name: $name, pinyin: $pinyin, note: $note }) {
      id
      name
      pinyin
      note
    }
  }
`;

export const USER_READING_PROGRESS_EXIST_QUERY = gqlTag`
  query UserReadingProgressExist($userId: GraphQLStringOrFloat!, $bookId: GraphQLStringOrFloat!) {
    User_Reading_Progress(
      filter: { user_id: { id: { _eq: $userId } }, book_id: { id: { _eq: $bookId } } }
    ) {
      id
      Chapter
      book_id {
        id
      }
    }
  }
`;

export const UPDATE_USER_READING_PROGRESS_MUTATION = gqlTag`
  mutation UpdateUserReadingProgress($ids: [ID!]!, $chapter: Int!, $decimal: Int!) {
    update_User_Reading_Progress_items(ids: $ids, data: { Chapter: $chapter, decimal: $decimal }) {
      id
    }
  }
`;

export const CREATE_USER_READING_PROGRESS_MUTATION = gqlTag`
  mutation CreateUserReadingProgress(
    $userId: ID!
    $bookId: ID!
    $chapter: Int!
    $decimal: Int!
  ) {
    create_User_Reading_Progress_item(
      data: {
        user_id: $userId,
        book_id: $bookId,
        Chapter: $chapter,
        decimal: $decimal,
        status: "published"
      }
    ) {
      id
    }
  }
`;

export const DELETE_USER_READING_PROGRESS_MUTATION = gqlTag`
  mutation DeleteUserReadingProgress($id: ID!) {
    delete_User_Reading_Progress_item(id: $id) {
      id
    }
  }
`;

export const GET_BOOK_LIBRARY_BY_ID_QUERY = gqlTag`
  query GetBookLibraryById($id: GraphQLStringOrFloat!) {
    book_library(filter: { id: { _eq: $id } }) {
      id
      title
      title_trans
      author
      author_trans
      summary
      view_count
      image {
        filename_disk
      }
      genre_id {
        book_genre_id {
          id
          title
        }
      }
      chapters_id {
        title
        content
        book_content
        sort_id
        date_created
        date_updated
        image_cover {
          filename_disk
        }
      }
    }
  }
`;

export const GET_BOOK_GENRES_QUERY = gqlTag`
  query GetBookGenres {
    book_genre {
      id
      title
    }
  }
`;

export const GET_BOOK_GENRES_WITH_BOOKS_QUERY = gqlTag`
  query GetBookGenresWithBooks {
    book_library_book_genre {
      id
      book_genre_id {
        id
        title
      }
      book_library_id {
        id
        title
        title_trans
        image {
          filename_disk
        }
        date_created
      }
    }
  }
`;

export const GET_BOOKS_BY_GENRE_ID_QUERY = gqlTag`
  query GetBooksByGenreId($genreId: GraphQLStringOrFloat!) {
    book_library_book_genre(
      filter: { book_genre_id: { id: { _eq: $genreId } } }
      sort: ["-book_library_id.date_created"]
    ) {
      id
      book_genre_id {
        id
        title
      }
      book_library_id {
        id
        title
        title_trans
        view_count
        image {
          filename_disk
        }
        date_created
      }
    }
  }
`;

export const GET_LATEST_BOOKS_QUERY = gqlTag`
  query GetLatestBooks {
    book_library(sort: ["-date_created"], limit: 5) {
      id
      title
      title_trans
      author
      author_trans
      image {
        filename_disk
      }
      date_created
    }
  }
`;

export const GET_TRENDING_BOOKS_QUERY = gqlTag`
  query GetTrendingBooks {
    book_library(sort: ["-popular"], limit: 5) {
      id
      title
      title_trans
      image {
        filename_disk
      }
      popular
      date_created
      date_updated
    }
  }
`;

export const GET_ALL_BOOKS_QUERY = gqlTag`
  query GetAllBooks {
    book_library {
      id
      title
      title_trans
      image {
        filename_disk
      }
      date_created
      date_updated
    }
  }
`;

export const GET_POPULAR_BOOKS_QUERY = gqlTag`
  query GetPopularBooks {
    book_library(
      limit: 5
      filter: { popular: { _contains: "True" } }
    ) {
      id
      title
      title_trans
      image {
        filename_disk
      }
      popular
      date_created
      date_updated
    }
  }
`;

export const CREATE_FLASHCARD_ITEM_MUTATION = gqlTag`
  mutation CreateFlashcardItem($vocabId: ID!, $deckId: ID!) {
    create_flashcard_item_item(
      data: { vocab_id: { id: $vocabId }, deck_id: { id: $deckId } }
    ) {
      id
      vocab_id {
        id
        name
        pinyin
        note
      }
      deck_id {
        id
        title
      }
    }
  }
`;

export const GET_TARGET_USER_QUERY = gqlTag`
  query GetTargetUser {
    target_user {
      id
      title
      description
    }
  }
`;

export const GET_SPEAKING_MODULES_QUERY = gqlTag`
  query GetSpeakingModules {
    speaking_topics(sort: ["-date_created"]) {
      id
      title
      description
      image_cover {
        filename_disk
      }
    }
  }
`;

export const GET_SPEAKING_CATEGORIES_QUERY = gqlTag`
  query GetSpeakingCategories($moduleId: GraphQLStringOrFloat!) {
    speaking_scenarios(filter: { topic_id: { id: { _eq: $moduleId } } }) {
      id
      title
      image_cover {
        filename_disk
      }
    }
  }
`;

export const GET_SPEAKING_DIALOGUES_QUERY = gqlTag`
  query GetSpeakingDialogues($categoryId: GraphQLStringOrFloat!) {
    speaking_dialogues(filter: { scenario_id: { id: { _eq: $categoryId } } }) {
      id
      chinese_text
      pinyin
      vietnamese_text
      speaker
      order
    }
  }
`;

export const GET_ALL_SPEAKING_SCENARIOS_QUERY = gqlTag`
  query GetAllSpeakingScenarios {
    speaking_scenarios(sort: ["-date_created"]) {
      id
      title
      image_cover {
        filename_disk
      }
      topic_id {
        id
        title
      }
    }
  }
`;

export const GET_GRAMMAR_MODULES_QUERY = gqlTag`
  query GetGrammarModules {
    grammar_modules {
      id
      title
    }
  }
`;

export const GET_GRAMMAR_ITEMS_QUERY = gqlTag`
  query GetGrammarItems {
    grammar_item {
      id
      title
      description
      content
      date_created
    }
  }
`;

export const GET_GRAMMAR_ITEMS_WITH_RELATIONS_QUERY = gqlTag`
  query GetGrammarItemsWithRelations {
    grammar_item {
      id
      title
      description
      content
      date_created
      topic_id {
        id
        title
      }
      grammar_module_id {
        id
        title
      }
    }
  }
`;

export const GET_GRAMMAR_DETAIL_QUERY = gqlTag`
  query GetGrammarDetail($grammarModuleId: GraphQLStringOrFloat!, $topicId: GraphQLStringOrFloat!) {
    grammar_item(
      filter: {
        _and: [
          { grammar_module_id: { id: { _eq: $grammarModuleId } } }
          { topic_id: { id: { _eq: $topicId } } }
        ]
      }
    ) {
      id
      title
      description
      content
      date_created
    }
  }
`;

export const GET_GRAMMAR_TOPICS_BY_MODULE_QUERY = gqlTag`
  query GetGrammarTopicsByModule($moduleId: GraphQLStringOrFloat!) {
    grammar_item(filter: { grammar_module_id: { id: { _eq: $moduleId } } }) {
      topic_id {
        id
        title
      }
    }
  }
`;

export const DELETE_USER_SYSTEM_MUTATION = gqlTag`
  mutation DeleteUserSystem($id: ID!) {
    delete_users_item(id: $id) {
      id
    }
  }
`;

export const GET_DICTIONARY_LEVELS_QUERY = gqlTag`
  query GetDictionaryLevels {
    dictionary_levels {
      id
      name
    }
  }
`;

export const GET_TOPICS_BY_LEVEL_QUERY = gqlTag`
  query GetTopicsByLevel($levelId: GraphQLStringOrFloat!) {
    vocab_display_map(filter: { level_id: { id: { _eq: $levelId } } }) {
      id
      topic_id {
        id
        name
        chinese_name
      }
    }
  }
`;

export const GET_VOCABS_BY_TOPIC_AND_LEVEL_QUERY = gqlTag`
  query GetVocabsByTopicAndLevel($topicId: GraphQLStringOrFloat!, $levelId: GraphQLStringOrFloat!) {
    vocab_display_map_vocab_items(
      limit: 100
      filter: {
        _and: [
          { vocab_display_map_id: { level_id: { id: { _eq: $levelId } } } }
          { vocab_display_map_id: { topic_id: { id: { _eq: $topicId } } } }
        ]
      }
    ) {
      vocab_items_id {
        id
        name
        pinyin
        note
      }
    }
  }
`;

export const GET_VOCABULARY_BY_CATEGORY_AND_TOPIC_QUERY = gqlTag`
  query GetVocabularyByCategoryAndTopic($categoryId: GraphQLStringOrFloat!, $topicId: GraphQLStringOrFloat!) {
    vocabulary(
      filter: {
        _and: [{ category_id: { _eq: $categoryId } }, { topic_id: { _eq: $topicId } }]
      }
    ) {
      id
      word
      Pinyin
      word_type
      meaning
      Example
    }
  }
`;

export const CREATE_FLASHCARD_DECK_MUTATION = gqlTag`
  mutation CreateFlashcardDeck($userId: ID!, $title: String!) {
    create_flashcard_deck_item(data: { user_id: { id: $userId }, title: $title }) {
      id
      user_id {
        id
      }
      title
      date_created
      date_updated
    }
  }
`;

export const GET_PERSONAL_FLASHCARD_DECKS_QUERY = gqlTag`
  query GetPersonalFlashcardDecks($userId: GraphQLStringOrFloat!) {
    flashcard_deck(filter: { user_id: { id: { _eq: $userId } } }) {
      id
      title
    }
  }
`;

export const GET_GENRE_OF_SECTION_QUERY = gqlTag`
  query GetGenreOfSection {
    genre_of_section {
      id
      title
      date_created
      date_updated
    }
  }
`;

export const GET_HSK_LEVELS_QUERY = gqlTag`
  query GetHskLevels {
    hsk_level {
      id
      title
      date_created
      date_updated
    }
  }
`;

export const GET_SECTION_BY_ID_QUERY = gqlTag`
  query GetSectionById($id: ID!) {
    Sections_by_id(id: $id) {
      id
      title
      title_trans
      image {
        id
        title
        filename_disk
        created_on
        description
        filename_download
      }
      file_script {
        id
        title
        filename_disk
        created_on
        description
        filename_download
      }
      SubRip_Subtitle {
        id
        title
        filename_disk
        created_on
        description
        filename_download
      }
      level
      genre_id {
        genre_of_section_id {
          id
          title
        }
      }
      date_created
    }
  }
`;

export const GET_GRAMMAR_OF_SECTION_QUERY = gqlTag`
  query GetGrammarOfSection($id: ID!) {
    grammar_of_section(filter: { section_id: { id: { _eq: $id } } }) {
      id
      title
    }
  }
`;

export const GET_VIDEO_SECTIONS_QUERY = gqlTag`
  query GetVideoSections {
    video_section(sort: ["-date_created"], limit: -1) {
      id
      author_id {
        id
        name
        avatar {
          id
          filename_disk
        }
      }
      Video_Source
      title
      title_trans
      YouTube_URL
      genre_id {
        id
        title
      }
      date_created
      date_updated
      image_cover {
        id
        filename_disk
      }
      video_file {
        id
        filename_disk
      }
      srt_file {
        id
        filename_disk
      }
    }
  }
`;

export const GET_NEW_VIDEOS_QUERY = gqlTag`
  query GetNewVideos {
    video_section(limit: 5, sort: "-date_created") {
      id
      Video_Source
      title
      title_trans
      author_id {
        id
        name
        avatar {
          id
          filename_disk
        }
      }
      YouTube_URL
      genre_id {
        id
        title
      }
      date_created
      date_updated
      image_cover {
        id
        filename_disk
      }
      video_file {
        id
        filename_disk
      }
      srt_file {
        id
        filename_disk
      }
    }
  }
`;
