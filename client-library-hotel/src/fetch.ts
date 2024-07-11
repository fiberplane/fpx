import { type Attributes, trace } from "@opentelemetry/api";
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH,
  SEMATTRS_HTTP_SCHEME,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL,
} from "@opentelemetry/semantic-conventions";
import { wrap } from "shimmer";
import { measure } from "./util";

type Fetch = typeof globalThis.fetch;
type FetchArgs = Parameters<Fetch>;
type Response = Awaited<ReturnType<Fetch>>;
type InputParam = FetchArgs[0];
type InitParam = FetchArgs[1];

export function patchFetch() {
  wrap(globalThis, "fetch", (original) => {
    async function customFetch(
      // Funky type definition to please the typescript
      // lord
      input: InputParam,
      init: InitParam,
    ) {
      const span = trace.getActiveSpan();

      if (span) {
        span.setAttributes(getRequestAttributes(input, init));
      }

      const response = await original(input, init);

      if (span) {
        const clonedResponse = response.clone();
        const attributes = await getResponseAttributes(clonedResponse);
        span.setAttributes(attributes);
      }

      return response;
    }

    return measure("fetch", customFetch) as typeof original;
  });
}

function getRequestAttributes(input: InputParam, init: InitParam) {
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
    "fpx.http.request_pathname": url.pathname,
    "fpx.http.request_search": url.search,
    "fpx.http.request_scheme": urlScheme,
  };

  // Init should not be null or undefined
  if (init) {
    const { body } = init;
    if (body != null) {
      attributes["http.request_body"] = formatBody(body);
    }

    if (init.headers) {
      attributes["fpx.http.request_headers_full"] = serializeHeaders(
        new Headers(init.headers),
      );
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

function serializeHeaders(headers: Headers) {
  const returnObject: Record<string, string> = {};
  headers.forEach((value, key) => {
    returnObject[key] = value;
  });
  return JSON.stringify(returnObject);
}

async function tryGetResponseBodyAsText(response: Response) {
  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function getResponseAttributes(response: Response) {
  const attributes: Attributes = {
    [SEMATTRS_HTTP_STATUS_CODE]: response.status,
    [SEMATTRS_HTTP_SCHEME]: response.url.split(":")[0],
  };

  const responseText = await tryGetResponseBodyAsText(response);
  if (responseText) {
    attributes["fpx.http.response_body"] = responseText;
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
  const responseHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  attributes["fpx.http.response_headers_full"] =
    JSON.stringify(responseHeaders);

  return attributes;
}
