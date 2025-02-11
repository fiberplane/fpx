import { useMedia } from "./useMedia";

/**
 * HACK - targeting `md` breakpoint from tailwind
 *
 * IMPROVE - Use css variable instead of hardcoded 640px?
 */
export function useIsSmScreen() {
  return useMedia("(max-width: 640px)");
}
