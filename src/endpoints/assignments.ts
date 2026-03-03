import type { WKResource } from "../types/common.js";
import type {
  AssignmentData,
  AssignmentListParams,
  AssignmentStartParams,
} from "../types/assignments.js";
import type { EndpointContext } from "./base.js";

export interface AssignmentEndpoints {
  getAssignment(id: number): Promise<WKResource<AssignmentData>>;
  listAssignments(params?: AssignmentListParams): AsyncIterable<WKResource<AssignmentData>>;
  startAssignment(id: number, params?: AssignmentStartParams): Promise<WKResource<AssignmentData>>;
}

export function assignmentEndpoints(ctx: EndpointContext): AssignmentEndpoints {
  return {
    getAssignment(id) {
      return ctx.get(`/assignments/${id}`);
    },
    listAssignments(params) {
      return ctx.paginate("/assignments", params);
    },
    startAssignment(id, params) {
      return ctx.request(`/assignments/${id}/start`, {
        method: "PUT",
        body: params ? { assignment: params } : undefined,
      });
    },
  };
}
