import { useMedia } from "@fiberplane/hooks";

/**
 * HACK - targeting `md` breakpoint from tailwind
 *
 * IMPROVE - Use css variable instead of hardcoded 640px?
 */
export function useIsSmScreen() {
  return useMedia("(min-width: 640px)");
}
