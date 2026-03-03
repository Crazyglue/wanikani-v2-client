import type { WKResource } from "../types/common.js";
import type { SubjectData, SubjectListParams } from "../types/subjects.js";
import type { EndpointContext } from "./base.js";

export interface SubjectEndpoints {
  getSubject(id: number): Promise<WKResource<SubjectData>>;
  listSubjects(params?: SubjectListParams): AsyncIterable<WKResource<SubjectData>>;
}

export function subjectEndpoints(ctx: EndpointContext): SubjectEndpoints {
  return {
    getSubject(id) {
      return ctx.get(`/subjects/${id}`);
    },
    listSubjects(params) {
      return ctx.paginate("/subjects", params);
    },
  };
}
