import type { WKSingularResource } from "../types/common.js";
import type { UserData, UserUpdateParams } from "../types/user.js";
import type { EndpointContext } from "./base.js";

export interface UserEndpoints {
  getUser(): Promise<WKSingularResource<UserData>>;
  updateUser(params: UserUpdateParams): Promise<WKSingularResource<UserData>>;
}

export function userEndpoints(ctx: EndpointContext): UserEndpoints {
  return {
    getUser() {
      return ctx.get("/user");
    },
    updateUser(params) {
      return ctx.request("/user", {
        method: "PUT",
        body: { user: params },
      });
    },
  };
}
