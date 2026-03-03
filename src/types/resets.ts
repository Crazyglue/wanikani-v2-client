export interface ResetData {
  confirmed_at: string | null;
  created_at: string;
  original_level: number;
  target_level: number;
}

export interface ResetListParams {
  ids?: number[];
  updated_after?: string;
}
