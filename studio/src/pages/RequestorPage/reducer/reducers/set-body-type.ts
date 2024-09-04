import { enforceFormDataTerminalDraftParameter } from "../../FormDataForm";
import type { RequestResponseSlice } from "../../store/slices/types";
import type { RequestBodyType } from "../state";

/**
 * This reducer is responsible for setting the body type of the request.
 * There's a lot of logic here to handle the different body types and their interactions.
 * It's messy, but it's its own function! SO we can start testing it. Some day.
 * We have big plans for this reducer function. Big plans.
 */
export function setBodyTypeInState(
  state: RequestResponseSlice,
  {
    type: newBodyType,
    isMultipart,
  }: {
    type: RequestBodyType;
    isMultipart?: boolean;
  },
): void {
  const oldBodyValue = state.body.value;
  const oldBodyType = state.body.type;
  // Handle the case where the body type is the same, but the multipart flag is different
  if (oldBodyType === newBodyType) {
    // HACK - Refactor
    if (state.body.type === "form-data") {
      // return {
      //   ...state,
      //   body: {
      //     ...state.body,
      //     isMultipart: !!isMultipart,
      //   },
      // };
      state.body.isMultipart = !!isMultipart;
    }
    // return state;
    return;
  }

  // Handle the case where the body type is changing to form-data, so we want to clear the body value
  if (newBodyType === "form-data") {
    state.body = {
      type: newBodyType,
      isMultipart: !!isMultipart,
      value: enforceFormDataTerminalDraftParameter([]),
    };
    return;
  }

  // Handle the case where the body type is changing to file, so we want to clear the body value and make it undefined
  if (newBodyType === "file") {
    // return {
    //   ...state,
    state.body = { type: newBodyType, value: undefined };
    // };
    return;
  }

  // At this point, we know the next body type is going to be text or json, soooo
  // Let's handle the case where the body type is changing to text or json,
  // meaning we want to clear the body value and make it an empty string
  if (oldBodyType === "form-data") {
    // return {
    // ...state,
    state.body = { type: newBodyType, value: "" }; //,
    // };
    return;
  }

  // HACK - These new few lines makes things clearer for typescript, but are a nightmare to read and reason about, i'm so sorry
  const isNonTextOldBody =
    Array.isArray(oldBodyValue) || oldBodyValue instanceof File;
  const newBodyValue = isNonTextOldBody ? "" : oldBodyValue;

  // return {
  // ...state,
  state.body = { type: newBodyType, value: newBodyValue }; //,
  // };
}
