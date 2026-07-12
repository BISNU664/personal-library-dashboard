export interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
  pages: number;
  rating: number;
  cover: string;
}

export interface SearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  edition_count?: number;
  first_publish_year?: number;
}