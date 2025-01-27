import { useMedia } from "./useMedia";

/**
 * HACK - targeting `lg` breakpoint from tailwind
 *
 * IMPROVE - Use css variable instead of hardcoded 1024px?
 * NOTE - Cannot rely on @fiberplane/hooks because it has buggy behavior that returns true by default...
 */
export function useIsLgScreen(defaultValue = false) {
  return useMedia("(min-width: 1024px)", defaultValue);
}
