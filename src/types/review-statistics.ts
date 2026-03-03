import type { SubjectType } from "./common.js";

export interface ReviewStatisticData {
  created_at: string;
  hidden: boolean;
  meaning_correct: number;
  meaning_current_streak: number;
  meaning_incorrect: number;
  meaning_max_streak: number;
  percentage_correct: number;
  reading_correct: number;
  reading_current_streak: number;
  reading_incorrect: number;
  reading_max_streak: number;
  subject_id: number;
  subject_type: SubjectType;
}

export interface ReviewStatisticListParams {
  hidden?: boolean;
  ids?: number[];
  percentages_greater_than?: number;
  percentages_less_than?: number;
  subject_ids?: number[];
  subject_types?: string[];
  updated_after?: string;
}
