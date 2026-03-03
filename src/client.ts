import { BaseClient, type ClientConfig } from "./endpoints/base.js";
import { assignmentEndpoints, type AssignmentEndpoints } from "./endpoints/assignments.js";
import {
  levelProgressionEndpoints,
  type LevelProgressionEndpoints,
} from "./endpoints/level-progressions.js";
import { resetEndpoints, type ResetEndpoints } from "./endpoints/resets.js";
import { reviewEndpoints, type ReviewEndpoints } from "./endpoints/reviews.js";
import {
  reviewStatisticEndpoints,
  type ReviewStatisticEndpoints,
} from "./endpoints/review-statistics.js";
import {
  spacedRepetitionSystemEndpoints,
  type SpacedRepetitionSystemEndpoints,
} from "./endpoints/spaced-repetition-systems.js";
import {
  studyMaterialEndpoints,
  type StudyMaterialEndpoints,
} from "./endpoints/study-materials.js";
import { subjectEndpoints, type SubjectEndpoints } from "./endpoints/subjects.js";
import { summaryEndpoints, type SummaryEndpoints } from "./endpoints/summary.js";
import { userEndpoints, type UserEndpoints } from "./endpoints/user.js";
import { voiceActorEndpoints, type VoiceActorEndpoints } from "./endpoints/voice-actors.js";

export type WaniKaniClientConfig = ClientConfig;

/**
 * Public client type. Only exposes endpoint methods — the internal
 * EndpointContext methods (get, list, paginate, request) are not part of this
 * type, keeping the consumer-facing API clean (#8).
 */
export type WaniKaniClient = AssignmentEndpoints &
  LevelProgressionEndpoints &
  ResetEndpoints &
  ReviewEndpoints &
  ReviewStatisticEndpoints &
  SpacedRepetitionSystemEndpoints &
  StudyMaterialEndpoints &
  SubjectEndpoints &
  SummaryEndpoints &
  UserEndpoints &
  VoiceActorEndpoints;

/**
 * Creates a new WaniKani API client.
 *
 * @example
 * ```ts
 * const client = createWaniKaniClient({ apiToken: "your-token" });
 *
 * const user = await client.getUser();
 * console.log(user.data.username);
 *
 * for await (const subject of client.listSubjects({ levels: [1, 2] })) {
 *   console.log(subject.data.characters);
 * }
 * ```
 */
export function createWaniKaniClient(config: WaniKaniClientConfig): WaniKaniClient {
  const base = new BaseClient(config);

  // Spread endpoint methods into a plain object. This avoids leaking BaseClient
  // internals (get, request, paginate, list) onto the public type and avoids
  // prototype-chain issues with Object.assign on class instances (#8).
  return {
    ...assignmentEndpoints(base),
    ...levelProgressionEndpoints(base),
    ...resetEndpoints(base),
    ...reviewEndpoints(base),
    ...reviewStatisticEndpoints(base),
    ...spacedRepetitionSystemEndpoints(base),
    ...studyMaterialEndpoints(base),
    ...subjectEndpoints(base),
    ...summaryEndpoints(base),
    ...userEndpoints(base),
    ...voiceActorEndpoints(base),
  };
}
