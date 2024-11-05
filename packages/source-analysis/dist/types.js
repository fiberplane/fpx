import relative from "resolve";
import * as bundledTs from "typescript";
export const bundledTypescript = bundledTs;
export const relativeResolve = relative.sync;
export const HONO_HTTP_METHODS = [
    "get",
    "post",
    "put",
    "delete",
    "patch",
    "options",
];
