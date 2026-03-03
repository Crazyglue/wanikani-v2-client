import type { WKResource } from "../types/common.js";
import type {
  LevelProgressionData,
  LevelProgressionListParams,
} from "../types/level-progressions.js";
import type { EndpointContext } from "./base.js";

export interface LevelProgressionEndpoints {
  getLevelProgression(id: number): Promise<WKResource<LevelProgressionData>>;
  listLevelProgressions(
    params?: LevelProgressionListParams,
  ): AsyncIterable<WKResource<LevelProgressionData>>;
}

export function levelProgressionEndpoints(ctx: EndpointContext): LevelProgressionEndpoints {
  return {
    getLevelProgression(id) {
      return ctx.get(`/level_progressions/${id}`);
    },
    listLevelProgressions(params) {
      return ctx.paginate("/level_progressions", params);
    },
  };
}
