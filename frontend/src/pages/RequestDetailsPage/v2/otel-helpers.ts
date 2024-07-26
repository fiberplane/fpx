import { FPX_REQUEST_BODY, FPX_REQUEST_PATHNAME, FPX_REQUEST_SEARCH, FPX_RESPONSE_BODY, SEMATTRS_HTTP_REQUEST_METHOD, SEMATTRS_HTTP_RESPONSE_STATUS_CODE } from "@/constants";
import { OtelSpan, isMizuRootRequestSpan } from "@/queries";
import { OtelAttributes } from "@/queries/traces-otel";

export function getMatchedRoute(span: OtelSpan) {
  return `${span.attributes["http.route"]}`;
}

export function getPath(span: OtelSpan) {
  const attribute = span.attributes[FPX_REQUEST_PATHNAME];
  return getString(attribute);
}

type AttributeValue = OtelAttributes[keyof OtelAttributes];
export function getString<T = string>(value?: AttributeValue, options?: {
  defaultValue: T,
}
) {
  if (value && "String" in value) {
    return value.String;
  }

  const { defaultValue = ""} = options || {};
  return defaultValue;
}

export function getNumber<T = number>(value?: AttributeValue, options?: {
    defaultValue: T,
}
) {
  if (value && "Int" in value) {
    return value.Int;
  }

  const { defaultValue = 0} = options || {};
  return defaultValue;
}

export function getQuery<T = string>(span: OtelSpan,) {
  const attribute = span.attributes[FPX_REQUEST_SEARCH];
  return getString(attribute);
}

export function getPathWithSearch(span: OtelSpan) {
  const path = getPath(span);
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
  return Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => key.startsWith("http.request.header."))
      .map(([key, value]) => [
        key.replace("http.request.header.", ""),
        `${value}`,
      ]),
  );
}

export function getRequestQueryParams(span: OtelSpan) {
  if (isMizuRootRequestSpan(span)) {
    const query = `${getQuery(span)}`;
    if (!query) {
      return null;
    }
    return Object.fromEntries(new URLSearchParams(query).entries());
  }

  try {
    const url = new URL(`${span.attributes["url.full"]}`);
    return Object.fromEntries(url.searchParams.entries());
  } catch (e) {
    return null;
  }
}

export function getResponseHeaders(span: OtelSpan) {
  return Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => key.startsWith("http.response.header."))
      .map(([key, value]) => [
        key.replace("http.response.header.", ""),
        `${getString(value)}`,
      ]),
  );
}

export function getMethod(span: OtelSpan) {
  return getString(span.attributes[SEMATTRS_HTTP_REQUEST_METHOD]);
}

export function getStatusCode(span: OtelSpan) {
  const value = span.attributes[SEMATTRS_HTTP_RESPONSE_STATUS_CODE]
  console.log('value', value);
  return value && "Int" in value ? value["Int"] : undefined;
}

// NOTE - Meant for SERVER spans
export function getFullUrl(span: OtelSpan) {
  const scheme = span.attributes["url.scheme"];
  const host = span.attributes["server.address"];
  const port = span.attributes["server.port"]
    ? `:${span.attributes["server.port"]}`
    : "";
  const path = span.attributes[FPX_REQUEST_PATHNAME]?.String;
  const queryParams = getQuery(span);
  const queryParamsString = queryParams ? `?${queryParams}` : "";
  return `${scheme}://${host}${port}${path}${queryParamsString}`;
}
