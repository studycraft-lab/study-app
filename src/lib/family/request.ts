import "server-only";

import { childIdFromRequest } from "./session";
import { getActiveChild } from "./store";

export async function childFromRequest(request: Request) {
  const id = childIdFromRequest(request);
  return id ? getActiveChild(id) : null;
}
