import type { WKResource } from "../types/common.js";
import type {
  StudyMaterialCreateParams,
  StudyMaterialData,
  StudyMaterialListParams,
  StudyMaterialUpdateParams,
} from "../types/study-materials.js";
import type { EndpointContext } from "./base.js";

export interface StudyMaterialEndpoints {
  getStudyMaterial(id: number): Promise<WKResource<StudyMaterialData>>;
  listStudyMaterials(
    params?: StudyMaterialListParams,
  ): AsyncIterable<WKResource<StudyMaterialData>>;
  createStudyMaterial(params: StudyMaterialCreateParams): Promise<WKResource<StudyMaterialData>>;
  updateStudyMaterial(
    id: number,
    params: StudyMaterialUpdateParams,
  ): Promise<WKResource<StudyMaterialData>>;
}

export function studyMaterialEndpoints(ctx: EndpointContext): StudyMaterialEndpoints {
  return {
    getStudyMaterial(id) {
      return ctx.get(`/study_materials/${id}`);
    },
    listStudyMaterials(params) {
      return ctx.paginate("/study_materials", params);
    },
    createStudyMaterial(params) {
      return ctx.request("/study_materials", {
        method: "POST",
        body: { study_material: params },
      });
    },
    updateStudyMaterial(id, params) {
      return ctx.request(`/study_materials/${id}`, {
        method: "PUT",
        body: { study_material: params },
      });
    },
  };
}
