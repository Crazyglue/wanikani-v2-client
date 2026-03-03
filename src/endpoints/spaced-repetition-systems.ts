import type { WKResource } from "../types/common.js";
import type {
  SpacedRepetitionSystemData,
  SpacedRepetitionSystemListParams,
} from "../types/spaced-repetition-systems.js";
import type { EndpointContext } from "./base.js";

export interface SpacedRepetitionSystemEndpoints {
  getSpacedRepetitionSystem(id: number): Promise<WKResource<SpacedRepetitionSystemData>>;
  listSpacedRepetitionSystems(
    params?: SpacedRepetitionSystemListParams,
  ): AsyncIterable<WKResource<SpacedRepetitionSystemData>>;
}

export function spacedRepetitionSystemEndpoints(
  ctx: EndpointContext,
): SpacedRepetitionSystemEndpoints {
  return {
    getSpacedRepetitionSystem(id) {
      return ctx.get(`/spaced_repetition_systems/${id}`);
    },
    listSpacedRepetitionSystems(params) {
      return ctx.paginate("/spaced_repetition_systems", params);
    },
  };
}
