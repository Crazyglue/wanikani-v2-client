import type { SubjectType } from "./common.js";

export interface AssignmentData {
  available_at: string | null;
  burned_at: string | null;
  created_at: string;
  hidden: boolean;
  passed_at: string | null;
  resurrected_at: string | null;
  srs_stage: number;
  started_at: string | null;
  subject_id: number;
  subject_type: SubjectType;
  unlocked_at: string | null;
}

export interface AssignmentListParams {
  available_after?: string;
  available_before?: string;
  burned?: boolean;
  hidden?: boolean;
  ids?: number[];
  immediately_available_for_lessons?: boolean;
  immediately_available_for_review?: boolean;
  in_review?: boolean;
  levels?: number[];
  srs_stages?: number[];
  started?: boolean;
  subject_ids?: number[];
  subject_types?: string[];
  unlocked?: boolean;
  updated_after?: string;
}

export interface AssignmentStartParams {
  started_at?: string;
}
