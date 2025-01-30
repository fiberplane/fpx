import { useMedia } from "@fiberplane/hooks";

/**
 * HACK - targeting `md` breakpoint from tailwind
 *
 * IMPROVE - Use css variable instead of hardcoded 768px?
 */
export function useIsMdScreen() {
  return useMedia("(min-width: 768px)");
}
