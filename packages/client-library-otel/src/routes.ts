import type { FpxLogger } from "./logger";
import type { PromiseStore } from "./promiseStore";
import type { HonoLikeApp } from "./types";

type FetchFn = typeof fetch;

/**
 * TODO - In production, we should make sure this request has some sort of repudiation
 *        We only want to respond like this when we know the request came from the service
 *        and not from a random user.
 */
export function isRouteInspectorRequest(request: Request) {
  return !!request.headers.get("X-Fpx-Route-Inspector");
}

/**
 * Sends the routes from the app to the FPX service.
 *
 * @param fetchFn - The fetch function to use to send the request.
 * @param fpxEndpoint - The endpoint of the FPX service.
 * @param app - The Hono app to get the routes from.
 * @param logger - The logger to use to log messages.
 * @param promiseStore - An optional promise store to add the request to.
 * @returns `true` if the routes were sent successfully or if the request was added to the promise store, `false` otherwise
 */
export async function sendRoutes(
  fetchFn: FetchFn,
  fpxEndpoint: string,
  app: HonoLikeApp,
  logger: FpxLogger,
  promiseStore?: PromiseStore,
) {
  const routes = getRoutesFromApp(app) ?? [];
  const openApiSpec = getOpenApiSpecFromApp(app);

  try {
    // NOTE - Construct url to the routes endpoint here, given the FPX endpoint.
    //        The routes endpoint is what we use to update the list of registered routes in Studio.
    const routesEndpoint = getRoutesEndpoint(fpxEndpoint);
    const responsePromise = fetchFn(routesEndpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ routes, openApiSpec }),
    });

    if (promiseStore) {
      promiseStore.add(responsePromise);
    } else {
      await responsePromise;
    }
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logger?.debug("Error sending routes to FPX:", message);
    return false;
  }
}

/**
 * Sends the routes from the app to the FPX service, then returns a response that can be used
 * for fpx route inspection requests.
 *
 * @param fetchFn - The fetch function to use to send the request.
 * @param fpxEndpoint - The endpoint of the FPX service.
 * @param app - The Hono app to get the routes from.
 * @returns A Response that can be sent back to the client
 */
export async function respondWithRoutes(
  fetchFn: FetchFn,
  fpxEndpoint: string,
  app: HonoLikeApp,
  logger: FpxLogger,
) {
  try {
    const success = await sendRoutes(fetchFn, fpxEndpoint, app, logger);
    return new Response(success ? "OK" : "Error sending routes to FPX", {
      status: success ? 200 : 500,
    });
  } catch (_e) {
    return new Response("Error sending routes to FPX", { status: 500 });
  }
}

function getRoutesFromApp(app: HonoLikeApp) {
  return app?.routes?.map((route) => ({
    method: route.method,
    path: route.path,
    handler: route.handler.toString(),
    handlerType: route.handler.length < 2 ? "route" : "middleware",
  }));
}

function getRoutesEndpoint(fpxEndpoint: string) {
  const routesEndpoint = new URL(fpxEndpoint);
  routesEndpoint.pathname = "/v0/probed-routes";
  return routesEndpoint.toString();
}

function getOpenApiSpecFromApp(app: HonoLikeApp) {
  return app.getOpenAPIDocument?.();
}
