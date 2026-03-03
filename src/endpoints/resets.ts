import type { WKResource } from "../types/common.js";
import type { ResetData, ResetListParams } from "../types/resets.js";
import type { EndpointContext } from "./base.js";

export interface ResetEndpoints {
  getReset(id: number): Promise<WKResource<ResetData>>;
  listResets(params?: ResetListParams): AsyncIterable<WKResource<ResetData>>;
}

export function resetEndpoints(ctx: EndpointContext): ResetEndpoints {
  return {
    getReset(id) {
      return ctx.get(`/resets/${id}`);
    },
    listResets(params) {
      return ctx.paginate("/resets", params);
    },
  };
}
