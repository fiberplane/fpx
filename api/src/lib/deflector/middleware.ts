import { headersToObject, resolveBody } from "@fiberplane/fpx-utils";
import type { MiddlewareHandler } from "hono";

import { eq } from "drizzle-orm";
import * as schema from "../../db/schema.js";
import logger from "../../logger.js";
import {
  handleFailedRequest,
  handleSuccessfulRequest,
} from "../proxy-request/index.js";
import type { Bindings, Variables } from "../types.js";
import { parkingLot } from "./index.js";

let isDeflectorEnabled = false;

export const setDeflectorStatus = (status: boolean) => {
  isDeflectorEnabled = status;
};

export const deflectorMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const deflectTo = c.req.header("x-fpx-deflect-to");
  if (!isDeflectorEnabled || !deflectTo) {
    return next();
  }

  const db = c.get("db");
  const traceId = crypto.randomUUID();
  const [requestUrl, deflectionType] = getTargetUrlAndDeflectionType(
    deflectTo,
    c.req.url,
  );
  logger.info(`Deflecting request to ${requestUrl}`);
  const newHeaders = new Headers(c.req.raw.headers);
  newHeaders.append("x-fpx-trace-id", traceId);

  const [{ id: requestId }] = await db
    .insert(schema.appRequests)
    .values({
      requestMethod: c.req.method as schema.NewAppRequest["requestMethod"],
      requestUrl: requestUrl.toString(),
      requestHeaders: headersToObject(newHeaders),
      requestPathParams: {},
      requestQueryParams: Object.fromEntries(requestUrl.searchParams),
      requestBody: await resolveBody(c.req),
      requestRoute: requestUrl.pathname,
    })
    .returning({ id: schema.appRequests.id });

  const startTime = Date.now();
  newHeaders.delete("x-fpx-deflect-to");

  try {
    let response: Response;
    if (deflectionType === "proxy") {
      response = await fetch(requestUrl, {
        method: c.req.method,
        headers: newHeaders,
        body: c.req.raw.body,
      });
    } else if (deflectionType === "serverSimulator") {
      response = await new Promise((resolve, reject) => {
        parkingLot.set(traceId, [c, resolve, reject]);
      });
    } else if (deflectionType === "mock") {
      const [r1] = await db
        .select()
        .from(schema.appRequests)
        .then((requests) =>
          requests.filter((request) => {
            return request.requestHeaders?.["x-fpx-deflect-to"] !== undefined;
          }),
        );

      if (r1?.id) {
        const [matchingResponse] = await db
          .select()
          .from(schema.appResponses)
          .where(eq(schema.appResponses.requestId, r1.id));
        response = new Response(matchingResponse.responseBody, {
          status: matchingResponse.responseStatusCode ?? 200,
          headers: matchingResponse.responseHeaders ?? {},
        });
      } else {
        throw new Error();
      }
    } else {
      throw new Error();
    }
    const duration = Date.now() - startTime;
    await handleSuccessfulRequest(
      db,
      requestId,
      duration,
      response.clone(),
      traceId,
    );

    return response;
  } catch (error) {
    logger.error("Error making request", error);
    const duration = Date.now() - startTime;
    await handleFailedRequest(db, requestId, traceId, duration, error);

    return c.json({ error: "Internal server error" }, 500);
  }
};

type DeflectionType = "proxy" | "serverSimulator" | "mock";

function getTargetUrlAndDeflectionType(
  targetString: string,
  requestString: string,
): [finalUrl: URL, deflectionType: DeflectionType] {
  try {
    const [targetUrl, requestUrl] = [targetString, requestString].map(
      (url) => new URL(url),
    );
    for (const prop of ["hostname", "port", "protocol"] as const) {
      requestUrl[prop] = targetUrl[prop];
    }
    return [requestUrl, "proxy"];
  } catch {
    const url = new URL(requestString);
    url.hostname = targetString;
    return [url, "serverSimulator"];
  }
}
