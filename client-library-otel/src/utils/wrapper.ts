export function isWrapped(func: unknown) {
  return (
    typeof func === "function" && "__wrapped" in func && func.__wrapped === true
  );
}
