import type { Response as WorkerResponse } from "@cloudflare/workers-types";
import type { Attributes } from "@opentelemetry/api";
import {
  SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH,
  SEMATTRS_HTTP_SCHEME,
} from "@opentelemetry/semantic-conventions";
import {
  EXTRA_SEMATTRS_HTTP_REQUEST_METHOD,
  EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE,
  EXTRA_SEMATTRS_URL_FULL,
  FPX_REQUEST_BODY,
  FPX_REQUEST_ENV,
  FPX_REQUEST_PATHNAME,
  FPX_REQUEST_SCHEME,
  FPX_REQUEST_SEARCH,
  FPX_RESPONSE_BODY,
  IGNORED_HEADERS,
} from "../constants";
import type {
  GlobalResponse,
  HonoResponse,
  InitParam,
  InputParam,
} from "../types";
import { getNodeSafeEnv } from "./env";
import { safelySerializeJSON } from "./json";

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

/**
 * Helper to get the request attributes for the root request.
 *
 * Requires that we have a cloned request, so we can get the body and headers
 * without consuming the original request.
 */
export async function getRootRequestAttributes(
  request: Request,
  honoEnv: unknown,
  options: {
    isLocal: boolean;
  },
) {
  const { isLocal } = options;
  let attributes: Attributes = {};

  // HACK - We need to account for the fact that the Hono `env` is different across runtimes
  //        If process.env is available, we use that, otherwise we use the `env` object from the Hono runtime
  const env = getNodeSafeEnv(honoEnv);

  // Only send env vars when running in local mode
  if (isLocal && env) {
    attributes[FPX_REQUEST_ENV] = safelySerializeJSON(env);
  }

  if (isLocal && request.body) {
    const bodyAttr = await formatRootRequestBody(request);
    if (bodyAttr) {
      attributes = {
        ...attributes,
        ...bodyAttr,
      };
    }
  }

  if (request.headers) {
    const headers = headersToObject(new Headers(request.headers));
    for (const [key, value] of Object.entries(headers)) {
      // Redact sensitive headers when running in production
      attributes[`http.request.header.${key}`] = getSafeHeaderValue(
        key,
        value,
        isLocal,
      );
    }
  }

  return attributes;
}

async function formatRootRequestBody(request: Request) {
  if (!request.body) {
    return null;
  }

  const contentType = request.headers.get("content-type");

  const shouldParseAsText =
    contentType?.includes("application/json") ||
    contentType?.includes("text/") ||
    contentType?.includes("x-www-form-urlencoded");

  if (shouldParseAsText) {
    // Return as text
    return {
      [FPX_REQUEST_BODY]: await request.text(),
    };
  }

  // TODO - Check how files are handled
  if (contentType?.includes("multipart/form-data")) {
    const formData = await request.formData();
    const textifiedFormData = formDataToJson(formData);
    return {
      [FPX_REQUEST_BODY]: textifiedFormData,
    };
  }

  return {
    [FPX_REQUEST_BODY]: formatBody(request.body),
  };
}

export function getRequestAttributes(
  input: InputParam,
  init: InitParam | undefined,
  options: {
    isLocal: boolean;
  },
) {
  const { isLocal } = options;
  const requestMethod =
    typeof input === "string" || input instanceof URL ? "GET" : input.method;
  const requestUrl = input instanceof Request ? input.url : input;
  const url = new URL(requestUrl);
  const urlScheme = url.protocol.replace(":", "");
  const attributes: Attributes = {
    [EXTRA_SEMATTRS_HTTP_REQUEST_METHOD]: requestMethod,
    // [HTTP_REQUEST_METHOD_ORIGINAL]: request.method,
    // TODO: remove login/password from URL (if we want to follow
    // the otel spec for this attribute)
    // TODO: think about how to handle a redirect
    [EXTRA_SEMATTRS_URL_FULL]: url.toString(),
    // Bunch of custom attributes even though some experimental
    // packages from otel already have similar attributes
    [FPX_REQUEST_PATHNAME]: url.pathname,
    [FPX_REQUEST_SEARCH]: url.search,
    // TODO: Add path
    // [SEMATTRS_]
    [FPX_REQUEST_SCHEME]: urlScheme,
  };

  // Init should not be null or undefined - but we do call it with undefined for the root request
  if (init) {
    const { body } = init;
    if (!isLocal && body != null) {
      attributes[FPX_REQUEST_BODY] = formatBody(body);
    }

    if (init.headers) {
      const headers = headersToObject(new Headers(init.headers));
      for (const [key, value] of Object.entries(headers)) {
        // Redact sensitive headers when running in production
        attributes[`http.request.header.${key}`] = getSafeHeaderValue(
          key,
          value,
          isLocal,
        );
      }
    }
  }

  return attributes;
}

function getSafeHeaderValue(key: string, value: string, isLocal: boolean) {
  if (!isLocal && IGNORED_HEADERS.has(key.toLowerCase())) {
    return "REDACTED";
  }

  return value;
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
      jsonObject[key].push(value ? formDataValueToString(value) : value);
    } else {
      jsonObject[key] = value ? formDataValueToString(value) : value;
    }
  }

  return JSON.stringify(jsonObject);
}

function formDataValueToString(value: string | File) {
  if (value instanceof File) {
    return value.name ?? `#fpx.file.{${value.name}}.{${value.size}}`;
  }

  return value;
}

async function tryGetResponseBodyAsText(
  response: GlobalResponse | WorkerResponse,
) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("image/")) {
    return "#fpx.image";
  }
  if (contentType?.includes("application/pdf")) {
    return "#fpx.pdf";
  }
  if (contentType?.includes("application/zip")) {
    return "#fpx.zip";
  }
  if (contentType?.includes("audio/")) {
    return "#fpx.audio";
  }
  if (contentType?.includes("video/")) {
    return "#fpx.video";
  }
  if (
    contentType?.includes("application/octet-stream") ||
    contentType?.includes("application/vnd.ms-excel") ||
    contentType?.includes(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) ||
    contentType?.includes("application/vnd.ms-powerpoint") ||
    contentType?.includes(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ) ||
    contentType?.includes("application/msword") ||
    contentType?.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
  ) {
    return "#fpx.binary";
  }

  try {
    if (response.body) {
      return await streamToString(response.body as ReadableStream);
    }
  } catch {
    // swallow error
  }

  return null;
}

// Helper function to convert a ReadableStream to a string
async function streamToString(stream: ReadableStream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    result += decoder.decode(value, { stream: true });
    if (done) {
      break;
    }
  }

  return result;
}

export async function getResponseAttributes(
  response: GlobalResponse | HonoResponse,
  options: {
    isLocal: boolean;
  },
) {
  const { isLocal } = options;
  const attributes: Attributes = {
    [EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE]: String(response.status),
    [SEMATTRS_HTTP_SCHEME]: response.url.split(":")[0],
  };

  if (isLocal) {
    const responseText = await tryGetResponseBodyAsText(response);
    if (responseText) {
      attributes[FPX_RESPONSE_BODY] = responseText;
    }
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    attributes[SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH] = contentLength;
  }

  const headers = response.headers;
  const responseHeaders = headersToObject(headers);
  for (const [key, value] of Object.entries(responseHeaders)) {
    attributes[`http.response.header.${key}`] = getSafeHeaderValue(
      key,
      value,
      isLocal,
    );
  }

  return attributes;
}
