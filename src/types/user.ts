export interface UserPreferences {
  default_voice_actor_id: number;
  extra_study_autoplay_audio: boolean;
  lessons_autoplay_audio: boolean;
  lessons_batch_size: number;
  lessons_presentation_order:
    | "ascending_level_then_subject"
    | "shuffled"
    | "ascending_level_then_shuffled";
  reviews_autoplay_audio: boolean;
  reviews_display_srs_indicator: boolean;
  reviews_presentation_order: "shuffled" | "lower_levels_first";
}

export interface UserSubscription {
  active: boolean;
  max_level_granted: number;
  period_ends_at: string | null;
  type: "free" | "recurring" | "lifetime" | "unknown";
}

export interface UserData {
  current_vacation_started_at: string | null;
  id: string;
  level: number;
  preferences: UserPreferences;
  profile_url: string;
  started_at: string;
  subscription: UserSubscription;
  username: string;
}

export interface UserUpdateParams {
  preferences?: Partial<UserPreferences>;
}
