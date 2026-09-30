import type { Request } from "express";
import { getUser } from "./policy";
import { getState } from "./state";

export const getActorId = (request: Request): string | undefined => {
  const headerValue = request.header("x-user-id");
  if (headerValue) {
    return headerValue;
  }

  if (typeof request.query.userId === "string") {
    return request.query.userId;
  }

  return undefined;
};

export const getActor = (request: Request) => getUser(getState(), getActorId(request));
