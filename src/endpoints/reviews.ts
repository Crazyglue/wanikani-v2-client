import type { WKResource } from "../types/common.js";
import type {
  ReviewCreateParams,
  ReviewCreateResponseData,
  ReviewData,
  ReviewListParams,
} from "../types/reviews.js";
import type { EndpointContext } from "./base.js";

export interface ReviewEndpoints {
  getReview(id: number): Promise<WKResource<ReviewData>>;
  listReviews(params?: ReviewListParams): AsyncIterable<WKResource<ReviewData>>;
  createReview(params: ReviewCreateParams): Promise<ReviewCreateResponseData>;
}

export function reviewEndpoints(ctx: EndpointContext): ReviewEndpoints {
  return {
    getReview(id) {
      return ctx.get(`/reviews/${id}`);
    },
    listReviews(params) {
      return ctx.paginate("/reviews", params);
    },
    createReview(params) {
      return ctx.request("/reviews", {
        method: "POST",
        body: { review: params },
      });
    },
  };
}
