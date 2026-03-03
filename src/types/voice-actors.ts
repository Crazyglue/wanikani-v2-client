export interface VoiceActorData {
  created_at: string;
  description: string;
  gender: "male" | "female";
  name: string;
}

export interface VoiceActorListParams {
  ids?: number[];
  updated_after?: string;
}
