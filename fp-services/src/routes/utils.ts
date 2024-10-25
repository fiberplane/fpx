export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // @ts-expect-error - works in practice
  return btoa(String.fromCharCode.apply(null, array));
}
