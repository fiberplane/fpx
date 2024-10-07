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
 * @returns
 */
export function sendRoutes(
  fetchFn: FetchFn,
  fpxEndpoint: string,
  app: HonoLikeApp,
) {
  const routes = getRoutesFromApp(app) ?? [];

  try {
    // HACK - Construct the routes endpoint here
    //        We could also do what we did before and submit the routes to the same `/v1/traces`
    //        but that route handler is so chaotic right now I wanted to have this as a separate
    //        endpoint.
    const routesEndpoint = getRoutesEndpoint(fpxEndpoint);
    fetchFn(routesEndpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ routes }),
    }).catch((_e) => {
      // NOTE - We're not awaiting this fetch, so we need to catch its errors
      //        to avoid unhandled promise rejections.
      // TODO - Use a logger, or only log if library debugging is enabled
      // console.error("Error sending routes to FPX", e);
    });
  } catch (_e) {
    // TODO - Use a logger, or only log if library debugging is enabled
    // console.error("Error sending routes to FPX", e);
  }
}

/**
 * Sends the routes from the app to the FPX service, then returns a response that can be used
 * for fpx route inspection requests.
 *
 * @param fetchFn - The fetch function to use to send the request.
 * @param fpxEndpoint - The endpoint of the FPX service.
 * @param app - The Hono app to get the routes from.
 * @returns
 */
export function respondWithRoutes(
  fetchFn: FetchFn,
  fpxEndpoint: string,
  app: HonoLikeApp,
) {
  sendRoutes(fetchFn, fpxEndpoint, app);
  return new Response("OK");
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
