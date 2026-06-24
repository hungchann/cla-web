/** Shared GraphQL selection for Sections list queries. */
export const SECTIONS_LIST_SELECTION = `
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
`;
