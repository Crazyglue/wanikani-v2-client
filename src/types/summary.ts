export interface SummaryLesson {
  available_at: string;
  subject_ids: number[];
}

export interface SummaryReview {
  available_at: string;
  subject_ids: number[];
}

export interface SummaryData {
  lessons: SummaryLesson[];
  next_reviews_at: string | null;
  reviews: SummaryReview[];
}
