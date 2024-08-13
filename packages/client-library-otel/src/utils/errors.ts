export function errorToJson(error: Error) {
  return {
    name: error.name, // Includes the name of the error, e.g., 'TypeError'
    message: error.message, // The message string of the error
    stack: error.stack, // Stack trace of where the error occurred (useful for debugging)
  };
}

type LikelyNeonDbError = {
  name: string;
  message: string;
  sourceError?: Error;
};

/**
 * Quick and dirty type guard to check if an error is *likely* a NeonDbError
 */
export function isLikelyNeonDbError(
  error: unknown,
): error is LikelyNeonDbError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string" &&
    "message" in error &&
    typeof error.message === "string" &&
    (!("sourceError" in error) || error.sourceError instanceof Error)
  );
}

export function neonDbErrorToJson(error: LikelyNeonDbError) {
  return {
    name: error.name,
    message: error.message,
    sourceError: error.sourceError ? errorToJson(error.sourceError) : undefined,

    // NOTE - NeonDbError does not include a stack trace! https://github.com/neondatabase/serverless/issues/82
    stack: error?.sourceError?.stack,

    // TODO - Figure out how to extract these fields from NeonDbError...
    //
    // where: error?.sourceError?.where,
    // table: error?.sourceError?.table,
    // column: error?.sourceError?.column,
    // dataType: error?.sourceError?.dataType,
    // internalQuery: error?.sourceError?.internalQuery,
  };
}
