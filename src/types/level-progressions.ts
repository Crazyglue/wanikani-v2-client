export interface LevelProgressionData {
  abandoned_at: string | null;
  completed_at: string | null;
  created_at: string;
  level: number;
  passed_at: string | null;
  started_at: string | null;
  unlocked_at: string | null;
}

export interface LevelProgressionListParams {
  ids?: number[];
  updated_after?: string;
}
