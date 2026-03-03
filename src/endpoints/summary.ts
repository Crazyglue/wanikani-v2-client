import type { WKReport } from "../types/common.js";
import type { SummaryData } from "../types/summary.js";
import type { EndpointContext } from "./base.js";

export interface SummaryEndpoints {
  getSummary(): Promise<WKReport<SummaryData>>;
}

export function summaryEndpoints(ctx: EndpointContext): SummaryEndpoints {
  return {
    getSummary() {
      return ctx.get("/summary");
    },
  };
}
