import type { WKResource } from "../types/common.js";
import type { VoiceActorData, VoiceActorListParams } from "../types/voice-actors.js";
import type { EndpointContext } from "./base.js";

export interface VoiceActorEndpoints {
  getVoiceActor(id: number): Promise<WKResource<VoiceActorData>>;
  listVoiceActors(params?: VoiceActorListParams): AsyncIterable<WKResource<VoiceActorData>>;
}

export function voiceActorEndpoints(ctx: EndpointContext): VoiceActorEndpoints {
  return {
    getVoiceActor(id) {
      return ctx.get(`/voice_actors/${id}`);
    },
    listVoiceActors(params) {
      return ctx.paginate("/voice_actors", params);
    },
  };
}
