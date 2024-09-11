import { useMedia } from "@fiberplane/hooks";

/**
 * HACK - targeting `lg` breakpoint from tailwind
 *
 * IMPROVE - Use css variable instead of hardcoded 1024px?
 */
export function useIsLgScreen() {
  return useMedia("(min-width: 1024px)");
}
