// Client
export { createWaniKaniClient } from "./client.js";
export type { WaniKaniClient, WaniKaniClientConfig } from "./client.js";

// Errors
export { WaniKaniError, WaniKaniApiError, WaniKaniRateLimitError } from "./utils/errors.js";

// Common types
export type {
  SubjectType,
  WKResource,
  WKSingularResource,
  WKCollection,
  WKPages,
  WKErrorResponse,
  WKReport,
} from "./types/common.js";

// Resource data types
export type {
  AssignmentData,
  AssignmentListParams,
  AssignmentStartParams,
} from "./types/assignments.js";

export type {
  LevelProgressionData,
  LevelProgressionListParams,
} from "./types/level-progressions.js";

export type { ResetData, ResetListParams } from "./types/resets.js";

export type {
  ReviewData,
  ReviewListParams,
  ReviewCreateParams,
  ReviewCreateResponseData,
} from "./types/reviews.js";

export type { ReviewStatisticData, ReviewStatisticListParams } from "./types/review-statistics.js";

export type {
  SrsStage,
  SpacedRepetitionSystemData,
  SpacedRepetitionSystemListParams,
} from "./types/spaced-repetition-systems.js";

export type {
  StudyMaterialData,
  StudyMaterialListParams,
  StudyMaterialCreateParams,
  StudyMaterialUpdateParams,
} from "./types/study-materials.js";

export type {
  Meaning,
  AuxiliaryMeaning,
  Reading,
  PronunciationAudio,
  ContextSentence,
  CharacterImage,
  RadicalData,
  KanjiData,
  VocabularyData,
  KanaVocabularyData,
  SubjectData,
  SubjectListParams,
} from "./types/subjects.js";

export type { SummaryData, SummaryLesson, SummaryReview } from "./types/summary.js";

export type {
  UserData,
  UserPreferences,
  UserSubscription,
  UserUpdateParams,
} from "./types/user.js";

export type { VoiceActorData, VoiceActorListParams } from "./types/voice-actors.js";
