export function isMedia(query: string) {
  return window.matchMedia(query).matches;
}

export function isLgScreen() {
  return isMedia("(min-width: 1024px)");
}
