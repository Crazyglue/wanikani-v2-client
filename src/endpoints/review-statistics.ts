import type { WKResource } from "../types/common.js";
import type { ReviewStatisticData, ReviewStatisticListParams } from "../types/review-statistics.js";
import type { EndpointContext } from "./base.js";

export interface ReviewStatisticEndpoints {
  getReviewStatistic(id: number): Promise<WKResource<ReviewStatisticData>>;
  listReviewStatistics(
    params?: ReviewStatisticListParams,
  ): AsyncIterable<WKResource<ReviewStatisticData>>;
}

export function reviewStatisticEndpoints(ctx: EndpointContext): ReviewStatisticEndpoints {
  return {
    getReviewStatistic(id) {
      return ctx.get(`/review_statistics/${id}`);
    },
    listReviewStatistics(params) {
      return ctx.paginate("/review_statistics", params);
    },
  };
}
