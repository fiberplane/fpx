import {
  KeyValueParameter,
  enforceTerminalDraftParameter,
} from "../KeyValueForm";
import { isDraftParameter } from "../KeyValueForm/data";
import { RequestorBody, RequestorState } from "./state";

export function addContentTypeHeader(state: RequestorState): RequestorState {
  const currentHeaders = state.requestHeaders;
  const currentContentTypeHeader = getCurrentContentType(state);

  const updateOperation = getUpdateOperation(
    currentContentTypeHeader,
    state.body,
  );

  let nextHeaders = currentHeaders;
  if (updateOperation?.type === "add") {
    nextHeaders = addHeader(currentHeaders, updateOperation.value);
  }
  if (updateOperation?.type === "update") {
    nextHeaders = updateHeader(currentHeaders, updateOperation.value);
  }
  if (updateOperation?.type === "remove") {
    nextHeaders = removeHeader(currentHeaders, updateOperation.value);
  }

  return {
    ...state,
    requestHeaders: enforceTerminalDraftParameter(nextHeaders),
  };
}

function addHeader(
  currentHeaders: KeyValueParameter[],
  newHeader: KeyValueParameter,
) {
  return currentHeaders.filter((p) => !isDraftParameter(p)).concat(newHeader);
}

function updateHeader(
  currentHeaders: KeyValueParameter[],
  newHeader: KeyValueParameter,
) {
  return currentHeaders.map((p) => (p.id === newHeader.id ? newHeader : p));
}

function removeHeader(
  currentHeaders: KeyValueParameter[],
  header: KeyValueParameter,
) {
  return currentHeaders.filter((p) => p.id !== header.id);
}

function mapBodyToContentType(body: RequestorBody) {
  if (body.type === "form-data" && body.isMultipart) {
    return "multipart/form-data";
  }
  if (body.type === "form-data" && !body.isMultipart) {
    return "application/x-www-form-urlencoded";
  }

  // TODO - Sniff the file extension, this could otherwise be very very annoying
  //        if we keep resetting their content type header when it's already set to like "application/iamge"
  if (body.type === "file") {
    return "application/octet-stream";
  }

  if (body.type === "json") {
    return "application/json";
  }
  if (body.type === "text") {
    return "text/plain";
  }

  return "text/plain";
}

function getCurrentContentType(state: RequestorState) {
  const currentContentType = state.requestHeaders.find(
    (header) => header.key?.toLowerCase() === "content-type",
  );
  if (!currentContentType) {
    return null;
  }
  return currentContentType;
}

function getUpdateOperation(
  currentContentTypeHeader: KeyValueParameter | null,
  currentBody: RequestorBody,
) {
  const nextContentTypeValue = mapBodyToContentType(currentBody);

  if (currentContentTypeHeader?.value?.startsWith(nextContentTypeValue)) {
    return null;
  }

  if (!currentContentTypeHeader) {
    // HACK - Avoid adding the content type header when it's already set to multipart/form-data
    //        We don't want to mess up the form boundary added by fetch
    if (currentBody.type === "form-data" && currentBody.isMultipart) {
      return null;
    }

    // Add the content type header
    return {
      type: "add",
      value: {
        id: crypto.randomUUID(),
        key: "Content-Type",
        value: nextContentTypeValue,
        enabled: true,
      },
    };
  }

  if (currentBody.type === "form-data" && currentBody.isMultipart) {
    return {
      type: "remove",
      value: currentContentTypeHeader,
    };
  }

  // Update the content type header
  return {
    type: "update",
    value: {
      ...currentContentTypeHeader,
      value: nextContentTypeValue,
    },
  };
}
