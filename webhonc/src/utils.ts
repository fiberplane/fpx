import type { WebHoncContext } from "./types";

export function resolveWebhoncId(c: WebHoncContext, id: string) {
  try {
    const doId = c.env.WEBHONC.idFromString(id);
    return doId;
  } catch (error) {
    // TypeError is thrown when the id is not a valid Durable Object ID
    // we handle those cases but this is in case the error is something else
    if (!(error instanceof TypeError)) {
      console.error(error);
    }

    return;
  }
}
