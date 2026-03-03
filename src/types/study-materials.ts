import type { SubjectType } from "./common.js";

export interface StudyMaterialData {
  created_at: string;
  hidden: boolean;
  meaning_note: string | null;
  meaning_synonyms: string[];
  reading_note: string | null;
  subject_id: number;
  subject_type: SubjectType;
}

export interface StudyMaterialListParams {
  hidden?: boolean;
  ids?: number[];
  subject_ids?: number[];
  subject_types?: string[];
  updated_after?: string;
}

export interface StudyMaterialCreateParams {
  subject_id: number;
  meaning_note?: string | null;
  meaning_synonyms?: string[];
  reading_note?: string | null;
}

export interface StudyMaterialUpdateParams {
  meaning_note?: string | null;
  meaning_synonyms?: string[];
  reading_note?: string | null;
}
