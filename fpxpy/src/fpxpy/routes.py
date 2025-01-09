from fastapi import FastAPI, Request, Response
from fastapi.openapi.utils import get_openapi
import requests
from urllib.parse import urlparse, urlunparse
import inspect
import os


def install(app: FastAPI) -> FastAPI:
    app.middleware("http")(middleware)

    return app


async def middleware(req: Request, call_next):
    header = req.headers.get("x-fpx-route-inspector")

    if header is not None:
        await send_to_studio(req)
        return Response(content="OK")

    return await call_next(req)


async def send_to_studio(req: Request):
    routes = []

    for route in req.app.routes:
        for method in route.methods:
            obj = {
                "method": method,
                "path": route.path,
                "handler": inspect.getsource(route.endpoint),
                "handlerType": "route",  # or "middleware"
            }

            routes.append(obj)

    # for middleware in req.app.user_middleware:
    #   obj = {
    #     "method": "all",
    #   "path": "/",
    #   "handler": inspect.getsource(middleware),
    #   "handlerType": "middleware"
    # }

    # routes.append(obj)

    env = os.getenv("FPX_ENDPOINT")

    if env is None:
        print("FPX_ENDPOINT is not set")
        return

    parsed_url = urlparse(env)
    parsed_url = parsed_url._replace(path="/v0/probed-routes")
    url = urlunparse(parsed_url)

    json = {
        "routes": routes,
        "openApiSpec": get_openapi(
            title="FastAPI", version="1.0.0", routes=req.app.routes
        ),
    }

    response = requests.post(url, json=json)

    if not response.ok:
        print(
            "error sending to probed routes:",
            response.content,
            "(status",
            response.status_code,
            ")",
        )
