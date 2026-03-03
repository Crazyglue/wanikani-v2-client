/** The four subject types in WaniKani. */
export type SubjectType = "radical" | "kanji" | "vocabulary" | "kana_vocabulary";

/** Wrapper envelope for a single API resource. */
export interface WKResource<T> {
  id: number;
  object: string;
  url: string;
  data_updated_at: string | null;
  data: T;
}

/** Wrapper envelope for a singular API resource that has no top-level id (e.g. /user). */
export interface WKSingularResource<T> {
  object: string;
  url: string;
  data_updated_at: string | null;
  data: T;
}

/** Pagination links returned with collection responses. */
export interface WKPages {
  next_url: string | null;
  previous_url: string | null;
  per_page: number;
}

/** Wrapper envelope for a paginated collection of resources. */
export interface WKCollection<T> {
  object: "collection";
  url: string;
  pages: WKPages;
  total_count: number;
  data_updated_at: string | null;
  data: WKResource<T>[];
}

/** Error response body from the API. */
export interface WKErrorResponse {
  error: string;
  code: number;
}

/** Report-type response (used by the summary endpoint). */
export interface WKReport<T> {
  object: "report";
  url: string;
  data_updated_at: string | null;
  data: T;
}
