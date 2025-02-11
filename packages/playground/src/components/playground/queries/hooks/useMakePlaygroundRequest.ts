import { useMutation } from "@tanstack/react-query";
import { reduceFormDataParameters } from "../../FormDataForm";
import { reduceKeyValueParameters } from "../../KeyValueForm";
import type {
  KeyValueParameter,
  PlaygroundActiveResponse,
  PlaygroundBody,
  PlaygroundResponseBody,
} from "../../store";
import { useStudioStore } from "../../store";

export type MakePlaygroundRequestQueryFn = ReturnType<
  typeof useMakePlaygroundRequest
>["mutate"];

export function useMakePlaygroundRequest() {
  const { setActiveResponse } = useStudioStore("setActiveResponse");

  const mutation = useMutation({
    mutationFn: makePlaygroundRequest,
    onSuccess: (data) => {
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
      setActiveResponse(null);
    },
  });

  return mutation;
}

function makePlaygroundRequest({
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
  body: PlaygroundBody;
  headers: KeyValueParameter[];
  pathParams?: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  route?: string;
}): Promise<PlaygroundActiveResponse> {
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

  // HACK - Generate a trace id for the request so we can link to it in the UI
  const otelTraceId = generateOtelTraceIdWebStandard();
  modHeaders["x-fpx-trace-id"] = otelTraceId;

  // We resolve the url with query parameters
  // const searchString = queryParamsForUrl.toString();

  // const resolvedPath = searchString ? `${safePath}?${searchString}` : safePath;

  // We create the body
  // FIXME - We should validate JSON in the UI itself
  const hackyBody = createBody(body);

  return fetch(proxyToUrl, {
    method,
    headers: modHeaders,
    body: method === "GET" || method === "HEAD" ? undefined : hackyBody,
  }).then(
    async (r) => {
      // Serialize response body to render in the UI
      const responseBody = await serializeResponseBody(r);
      // Serialize response headers into a JavaScript object
      const responseHeaders = Object.fromEntries(r.headers.entries());
      return {
        traceId: otelTraceId,
        responseHeaders,
        responseBody,
        responseStatusCode: r.status.toString(),
        isFailure: responseBody.type === "error",

        // NOTE - Need these fields for UI, to render the summary in the response panel
        requestUrl: proxyToUrl,
        requestMethod: method,
      };
    },
    (error) => {
      console.error("Error making playground request", error);
      return {
        traceId: otelTraceId,
        responseHeaders: null,
        responseBody: {
          contentType: "",
          type: "error",
          value: null,
        },
        responseStatusCode: "",
        isFailure: true,
        requestUrl: proxyToUrl,
        requestMethod: method,
      };
    },
  );
}

async function serializeResponseBody(
  response: Response,
): Promise<PlaygroundResponseBody> {
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

function createBody(body: PlaygroundBody) {
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

/**
 * Set a trace id in the headers of the request using web standard apis
 *
 * Should be compatible with the OpenTelemetry standard
 * Otel trace ids are 16 bytes long, and can be represented as a hex string
 */
function generateOtelTraceIdWebStandard(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
