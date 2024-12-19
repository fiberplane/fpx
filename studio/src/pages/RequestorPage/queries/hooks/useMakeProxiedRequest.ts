import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reduceFormDataParameters } from "../../FormDataForm";
import { reduceKeyValueParameters } from "../../KeyValueForm";
import type {
  KeyValueParameter,
  RequestorBody,
  RequestorResponseBody,
} from "../../store";
import { useStudioStore } from "../../store";
import { REQUESTOR_REQUESTS_KEY } from "./constants";

export type MakeProxiedRequestQueryFn = ReturnType<
  typeof useMakeProxiedRequest
>["mutate"];

export function useMakeProxiedRequest() {
  const { setActiveResponse } = useStudioStore("setActiveResponse");

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: makeProxiedRequest,
    onSuccess: (data) => {
      // Invalidate and refetch requestor requests
      queryClient.invalidateQueries({ queryKey: [REQUESTOR_REQUESTS_KEY] });

      // Make sure the response panel is cleared of data, then add the new response
      if (data) {
        setActiveResponse(data);
      } else {
        console.error(
          "No data returned from makeProxiedRequest - this should not happen!",
        );
        setActiveResponse(null);
      }
    },
    onError: () => {
      // Make sure the response panel is cleared of data
      console.error(
        "Error in makeProxiedRequest - setting active response to null",
      );
      setActiveResponse(null);
    },
  });

  return mutation;
}

function makeProxiedRequest({
  addServiceUrlIfBarePath,
  path,
  method,
  body,
  headers,
  pathParams,
  queryParams,
  route,
}: {
  addServiceUrlIfBarePath: (path: string) => string;
  path: string;
  method: string;
  body: RequestorBody;
  headers: KeyValueParameter[];
  pathParams?: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  route?: string;
}) {
  // HACK - We need to make sure the path is safe to use as a URL pathname
  let safePath: string;
  try {
    const url = new URL(path);
    safePath = url.pathname;
  } catch {
    safePath = path?.startsWith("/") ? path : `/${path}`;
  }

  const queryParamsForUrl = new URLSearchParams();
  for (const param of queryParams) {
    if (param.enabled) {
      queryParamsForUrl.set(param.key, param.value);
    }
  }

  // NOTE - we add custom headers to record additional metadata about the request
  const modHeaders = reduceKeyValueParameters(headers);
  if (route) {
    modHeaders["x-fpx-route"] = route;
  }
  // HACK - Serialize path params into a header
  //        This could cause encoding issues if there are funky chars in the path params
  modHeaders["x-fpx-path-params"] = JSON.stringify(
    reduceKeyValueParameters(pathParams ?? []),
  );

  // HACK - This is the most secure code I've ever written
  //        We're serializing the proxy-to url into a header
  //        and this is the url that ultimately receives the request
  const proxyToUrl = addServiceUrlIfBarePath(path);
  modHeaders["x-fpx-proxy-to"] = proxyToUrl;

  // HACK - Serialize headers into the headers waaaaat
  modHeaders["x-fpx-headers-json"] = JSON.stringify(modHeaders);

  // We resolve the url with query parameters
  const searchString = queryParamsForUrl.toString();

  const resolvedPath = searchString ? `${safePath}?${searchString}` : safePath;

  // We create the body
  // FIXME - We should validate JSON in the UI itself
  const hackyBody = createBody(body);

  return fetch(`/v0/proxy-request${resolvedPath}`, {
    method,
    headers: modHeaders,
    body: method === "GET" || method === "HEAD" ? undefined : hackyBody,
  }).then(async (r) => {
    // Serialize response body to render in the UI
    const responseBody = await serializeResponseBody(r);
    // Serialize response headers into a JavaScript object
    const responseHeaders = Object.fromEntries(r.headers.entries());
    return {
      traceId: r.headers.get("x-fpx-trace-id") ?? crypto.randomUUID(),
      responseHeaders,
      responseBody,
      responseStatusCode: r.status.toString(),
      isFailure: responseBody.type === "error",

      // NOTE - Need these fields for UI, to render the summary in the response panel
      requestUrl: proxyToUrl,
      requestMethod: method,
    };
  });
}

async function serializeResponseBody(
  response: Response,
): Promise<RequestorResponseBody> {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (!response.body) {
      return {
        contentType,
        type: "empty",
      };
    }

    if (contentType.includes("application/json")) {
      const json = await response.text();
      return {
        contentType,
        type: "json",
        value: json,
      };
    }

    if (contentType.includes("text/html")) {
      const text = await response.text();
      return {
        contentType,
        type: "html",
        value: text,
      };
    }

    if (contentType.includes("text/")) {
      const text = await response.text();
      return {
        contentType,
        type: "text",
        value: text,
      };
    }

    // Handle binary data
    const binaryContentTypes = [
      "application/octet-stream",
      "image/",
      "audio/",
      "video/",
      "application/pdf",
      "application/zip",
      // Add more binary content types as needed
    ];

    if (binaryContentTypes.some((type) => contentType.includes(type))) {
      const buffer = await response.arrayBuffer();
      return {
        contentType,
        type: "binary",
        value: buffer,
      };
    }

    // Default case for unknown content types
    const text = await response.text();
    return {
      contentType,
      type: "unknown",
      value: text,
    };
  } catch (e) {
    console.error("Error serializing response body", e);
    return {
      contentType,
      type: "error",
      value: null,
    };
  }
}

function createBody(body: RequestorBody) {
  if (body.type === "json") {
    if (typeof body.value !== "undefined") {
      return body.value;
    }
    return undefined;
  }
  // NOTE - We automatically send multipart when there's a file
  if (body.type === "form-data") {
    const isMultipart = !!body.isMultipart;
    // FIXME - Remove this eventually and provide a dialogue in the ui when someone adds a non-text file to a urlencoded form (a la httpie)
    const hasFile = body.value.some((item) => item.value.type === "file");
    if (isMultipart || hasFile) {
      return reduceFormDataParameters(body.value);
    }
    return createUrlEncodedBody(
      reduceKeyValueParameters(
        body.value.map((item) => ({
          id: item.id,
          enabled: item.enabled,
          key: item.key,
          // HACK - We know these are all non-strings because of the `hasFile` case above
          value: item.value.value as string,
        })),
      ),
    );
  }

  return body.value;
}

// NOTE - This is for urlencoded (not multipart)
function createUrlEncodedBody(body: Record<string, string>) {
  return new URLSearchParams(body).toString();
}
