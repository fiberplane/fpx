/**
 * SEMATTRS_* are constants that should actually be exposed by the Samantic Conventions package
 * but are not.
 */
export const EXTRA_SEMATTRS_HTTP_REQUEST_METHOD = "http.request.method";
export const EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE =
  "http.response.status_code";
export const EXTRA_SEMATTRS_URL_FULL = "url.full";

export const FPX_REQUEST_PATHNAME = "fpx.http.request.pathname";
export const FPX_REQUEST_SEARCH = "fpx.http.request.search";
export const FPX_REQUEST_SCHEME = "fpx.http.request.scheme";
export const FPX_REQUEST_BODY = "fpx.http.request.body";
export const FPX_REQUEST_ENV = "fpx.http.request.env";

export const FPX_RESPONSE_BODY = "fpx.http.response.body";

export const CF_BINDING_TYPE = "cf.binding.type";
export const CF_BINDING_NAME = "cf.binding.name";
export const CF_BINDING_METHOD = "cf.binding.method";
export const CF_BINDING_ERROR = "cf.binding.error";

// NOT YET IMPLEMENTED
export const FPX_REQUEST_HANDLER_FILE = "fpx.http.request.handler.file";
export const FPX_REQUEST_HANDLER_SOURCE_CODE =
  "fpx.http.request.handler.source_code";
