import type { WKResource } from "./common.js";
import type { AssignmentData } from "./assignments.js";
import type { ReviewStatisticData } from "./review-statistics.js";

export interface ReviewData {
  assignment_id: number;
  created_at: string;
  ending_srs_stage: number;
  incorrect_meaning_answers: number;
  incorrect_reading_answers: number;
  spaced_repetition_system_id: number;
  starting_srs_stage: number;
  subject_id: number;
}

export interface ReviewListParams {
  assignment_ids?: number[];
  ids?: number[];
  subject_ids?: number[];
  updated_after?: string;
}

/** Shared fields for review creation. */
interface ReviewCreateBase {
  incorrect_meaning_answers: number;
  incorrect_reading_answers: number;
  created_at?: string;
}

/**
 * Params for creating a review. Exactly one of `assignment_id` or `subject_id`
 * must be provided (#7).
 */
export type ReviewCreateParams =
  | (ReviewCreateBase & { assignment_id: number; subject_id?: never })
  | (ReviewCreateBase & { subject_id: number; assignment_id?: never });

export interface ReviewCreateResponseData {
  id: number;
  object: "review";
  url: string;
  data_updated_at: string;
  data: ReviewData;
  resources_updated: {
    assignment: WKResource<AssignmentData>;
    review_statistic: WKResource<ReviewStatisticData>;
  };
}
