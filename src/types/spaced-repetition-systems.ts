export interface SrsStage {
  interval: number | null;
  interval_unit: "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | null;
  position: number;
}

export interface SpacedRepetitionSystemData {
  burning_stage_position: number;
  created_at: string;
  description: string;
  name: string;
  passing_stage_position: number;
  starting_stage_position: number;
  stages: SrsStage[];
  unlocking_stage_position: number;
}

export interface SpacedRepetitionSystemListParams {
  ids?: number[];
  updated_after?: string;
}
