import {
  FPX_REQUEST_BODY,
  FPX_REQUEST_HEADERS_FULL,
  FPX_REQUEST_PATHNAME,
  FPX_REQUEST_SEARCH,
  FPX_RESPONSE_BODY,
  FPX_RESPONSE_HEADERS_FULL,
  SEMATTRS_HTTP_REQUEST_METHOD,
  SEMATTRS_HTTP_RESPONSE_STATUS_CODE,
  SEMATTRS_URL_FULL,
} from "@/constants";
import {
  OtelSpan,
  //  isMizuRootRequestSpan
} from "@/queries";
import {
  OtelAttributes,
  // OtelEvent
} from "@/queries/traces-otel";
// import { SEMATTRS_EXCEPTION_STACKTRACE } from "@opentelemetry/semantic-conventions";

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
  // return `${span.attributes[FPX_RESPONSE_BODY]}`;
}

export function getRequestHeaders(span: OtelSpan) {
  const headers = getString(span.attributes[FPX_REQUEST_HEADERS_FULL]);

  try {
    return JSON.parse(headers);
  } catch {
    return {};
    // return null;
  }
}

export function getRequestQueryParams(span: OtelSpan) {
  // if (isMizuRootRequestSpan(span)) {
  //   const query = `${getQuery(span)}`;
  //   if (!query) {
  //     return null;
  //   }
  //   return Object.fromEntries(new URLSearchParams(query).entries());
  // }

  try {
    const urlAttribute = getRequestUrl(span);
    const url = new URL(urlAttribute);
    return Object.fromEntries(url.searchParams.entries());
  } catch (e) {
    return null;
  }
}

export function getResponseHeaders(span: OtelSpan) {
  const headers = getString(span.attributes[FPX_RESPONSE_HEADERS_FULL]);
  try {
    return JSON.parse(headers);
  } catch {
    return {};
  }
  // return Object.fromEntries(
  //   Object.entries(span.attributes)
  //     .filter(([key]) => key.startsWith("http.response.header."))
  //     .map(([key, value]) => [
  //       key.replace("http.response.header.", ""),
  //       `${getString(value)}`,
  //     ]),
  // );
}

export function getRequestMethod(span: OtelSpan) {
  return getString(span.attributes[SEMATTRS_HTTP_REQUEST_METHOD]);
}

// export function getStack(event: OtelEvent) {
//   return getString(event.attributes[SEMATTRS_EXCEPTION_STACKTRACE]);
// }

// export function getLevel(event: OtelEvent) {
//   return getString(event.attributes["level"]);
// }

export function getStatusCode(span: OtelSpan) {
  return getNumber(span.attributes[SEMATTRS_HTTP_RESPONSE_STATUS_CODE]);
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
  return getString(span.attributes[SEMATTRS_URL_FULL]);
  // return `${span.attributes["url.full"]}`;
}
