import type { Response as WorkerResponse } from "@cloudflare/workers-types";
import type { Attributes } from "@opentelemetry/api";
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH,
  SEMATTRS_HTTP_SCHEME,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL,
} from "@opentelemetry/semantic-conventions";
import {
  FPX_REQUEST_BODY,
  FPX_REQUEST_HEADERS_FULL,
  FPX_REQUEST_PATHNAME,
  FPX_REQUEST_SCHEME,
  FPX_REQUEST_SEARCH,
  FPX_RESPONSE_BODY,
  FPX_RESPONSE_HEADERS_FULL,
} from "../constants";
import type {
  GlobalResponse,
  HonoResponse,
  InitParam,
  InputParam,
} from "../types";

// There are so many different types of headers
// and we want to support all of them so we can 
// use a single function to do it all
type PossibleHeaders =
  | Headers
  | HonoResponse["headers"]
  | GlobalResponse["headers"];
  
export function headersToObject(headers: PossibleHeaders) {
  const returnObject: Record<string, string> = {};
  headers.forEach((value, key) => {
    returnObject[key] = value;
  });

  return returnObject;
}

export function getRequestAttributes(input: InputParam, init?: InitParam) {
  const requestMethod =
    typeof input === "string" || input instanceof URL ? "GET" : input.method;
  const requestUrl = input instanceof Request ? input.url : input;
  const url = new URL(requestUrl);
  const urlScheme = url.protocol.replace(":", "");
  const attributes: Attributes = {
    [SEMATTRS_HTTP_METHOD]: requestMethod,
    // [HTTP_REQUEST_METHOD_ORIGINAL]: request.method,
    // TODO: remove login/password from URL (if we want to follow
    // the otel spec for this attribute)
    // TODO: think about how to handle a redirect
    [SEMATTRS_HTTP_URL]: url.toString(),
    // Bunch of custom attributes even though some experimental
    // packages from otel already have similar attributes
    [FPX_REQUEST_PATHNAME]: url.pathname,
    [FPX_REQUEST_SEARCH]: url.search,
    [FPX_REQUEST_SCHEME]: urlScheme,
  };

  // Init should not be null or undefined
  if (init) {
    const { body } = init;
    if (body != null) {
      attributes[FPX_REQUEST_BODY] = formatBody(body);
    }

    if (init.headers) {
      const headers = headersToObject(new Headers(init.headers));
      attributes[FPX_REQUEST_HEADERS_FULL] = JSON.stringify(headers);
      for (const [key, value] of Object.entries(headers)) {
        attributes[`http.request.header.${key}`] = value;
      }
    }
  }

  return attributes;
}

function formatBody(body: BodyInit) {
  if (body instanceof FormData) {
    return formDataToJson(body);
  }

  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return "#fpx.arrayBuffer";
  }
  if (body instanceof ReadableStream) {
    return "#fpx.stream";
  }
  if (body instanceof Blob) {
    return "#fpx.blob";
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  return body;
}
function formDataToJson(formData: FormData) {
  const jsonObject: Record<string, string | Array<string>> = {};

  for (const [key, value] of formData.entries()) {
    // Handle multiple values for the same key (e.g., checkboxes)
    if (jsonObject[key]) {
      if (!Array.isArray(jsonObject[key])) {
        jsonObject[key] = [jsonObject[key]];
      }
      jsonObject[key].push(value);
    } else {
      jsonObject[key] = value;
    }
  }

  return JSON.stringify(jsonObject);
}

async function tryGetResponseBodyAsText(
  response: GlobalResponse | WorkerResponse,
) {
  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function getResponseAttributes(
  response: GlobalResponse | HonoResponse,
) {
  const attributes: Attributes = {
    [SEMATTRS_HTTP_STATUS_CODE]: response.status,
    [SEMATTRS_HTTP_SCHEME]: response.url.split(":")[0],
  };

  const responseText = await tryGetResponseBodyAsText(response);
  if (responseText) {
    attributes[FPX_RESPONSE_BODY] = responseText;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    try {
      attributes[SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH] = Number.parseInt(
        contentLength,
        10,
      );
    } catch {
      // ignore errors
    }
  }

  const headers = response.headers;
  const responseHeaders = headersToObject(headers);
  attributes[FPX_RESPONSE_HEADERS_FULL] = JSON.stringify(responseHeaders);
  for (const [key, value] of Object.entries(responseHeaders)) {
    attributes[`http.response.header.${key}`] = value;
  }

  return attributes;
}
