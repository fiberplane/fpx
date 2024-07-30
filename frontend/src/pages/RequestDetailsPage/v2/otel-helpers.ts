import {
  EXTRA_SEMATTRS_HTTP_REQUEST_METHOD,
  EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE,
  EXTRA_SEMATTRS_URL_FULL,
  FPX_REQUEST_BODY,
  FPX_REQUEST_PATHNAME,
  FPX_REQUEST_SEARCH,
  FPX_RESPONSE_BODY,
  SpanKind,
} from "@/constants";
import { OtelSpan } from "@/queries";
import { OtelAttributes } from "@/queries/traces-otel";

export function getMatchedRoute(span: OtelSpan) {
  // TODO support this in the otel client
  return getString(span.attributes["http.route"]);
}

export function getRequestPath(span: OtelSpan) {
  const attribute = span.attributes[FPX_REQUEST_PATHNAME];
  return getString(attribute);
}

type AttributeValue = OtelAttributes[keyof OtelAttributes];
export function getString<T = string>(
  value?: AttributeValue,
  options?: {
    defaultValue: T;
  },
) {
  if (value && "String" in value) {
    return value.String;
  }

  const { defaultValue = "" } = options || {};
  return defaultValue;
}

export function getNumber<T = number>(
  value?: AttributeValue,
  options?: {
    defaultValue: T;
  },
) {
  if (value && "Int" in value) {
    return value.Int;
  }

  const { defaultValue = 0 } = options || {};
  return defaultValue;
}

export function getQuery(span: OtelSpan) {
  const attribute = span.attributes[FPX_REQUEST_SEARCH];
  return getString(attribute);
}

export function getPathWithSearch(span: OtelSpan) {
  const path = getRequestPath(span);
  const queryParams = getQuery(span);
  const queryParamsString = queryParams ? `?${queryParams}` : "";
  return `${path}${queryParamsString}`;
}

export function getRequestBody(span: OtelSpan) {
  return getString(span.attributes[FPX_REQUEST_BODY], {
    defaultValue: undefined,
  });
}

export function getResponseBody(span: OtelSpan) {
  return getString(span.attributes[FPX_RESPONSE_BODY], {
    defaultValue: undefined,
  });
}

export function getRequestHeaders(span: OtelSpan) {
  const headers: Record<string, string> = {};
  const keys = Object.keys(span.attributes);

  for (const key of keys) {
    if (key.startsWith("http.request.header.")) {
      headers[key.replace("http.request.header.", "")] = getString(
        span.attributes[key],
      );
    }
  }

  return headers;
}

export function getRequestQueryParams(span: OtelSpan) {
  try {
    const urlAttribute = getRequestUrl(span);
    const url = new URL(urlAttribute);
    return Object.fromEntries(url.searchParams.entries());
  } catch (e) {
    return null;
  }
}

export function getResponseHeaders(span: OtelSpan) {
  const headers: Record<string, string> = {};
  const keys = Object.keys(span.attributes);
  for (const key of keys) {
    if (key.startsWith("http.response.header.")) {
      headers[key.replace("http.response.header.", "")] = getString(
        span.attributes[key],
      );
    }
  }

  return headers;
}

export function getRequestMethod(span: OtelSpan) {
  return getString(span.attributes[EXTRA_SEMATTRS_HTTP_REQUEST_METHOD]);
}

export function getStatusCode(span: OtelSpan) {
  return getNumber(span.attributes[EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE]);
}

// NOTE - Meant for SERVER spans
// export function getFullUrl(span: OtelSpan) {
//   const schema = getString(span.attributes[FPX_REQUEST_SCHEME]);
//   const scheme = span.attributes["url.scheme"];
//   const host = span.attributes["server.address"];
//   const port = span.attributes["server.port"]
//     ? `:${span.attributes["server.port"]}`
//     : "";
//   const path = span.attributes[FPX_REQUEST_PATHNAME]?.String;
//   const queryParams = getQuery(span);
//   const queryParamsString = queryParams ? `?${queryParams}` : "";
//   return `${scheme}://${host}${port}${path}${queryParamsString}`;
// }

export function getRequestUrl(span: OtelSpan) {
  return getString(span.attributes[EXTRA_SEMATTRS_URL_FULL]);
}

export function isFetchSpan(span: OtelSpan) {
  return span.kind === SpanKind.CLIENT && span.name.toLowerCase() === "fetch";
}

export function isIncomingRequestSpan(span: OtelSpan) {
  return span.name.toLowerCase() === "request" && span.kind === SpanKind.SERVER;
}
