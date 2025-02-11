import { useEffect, useState } from "react";

/**
 * NOTE - I couldn't use the @fiberplane/hooks useMedia hook because it has buggy behavior that returns true by default...
 *
 * Returns whether the current window matches the given media query.
 * Accepts an optional default value for SSR or before the media query is checked.
 */
export function useMedia(query: string, defaultValue = false) {
  // Initialize with actual media query match if window exists, otherwise use default
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Bail if no window (SSR)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Set initial state again in effect to handle
    // potential mismatch between SSR and client
    setMatches(mediaQueryList.matches);

    const onChange = () => setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", onChange);

    return () => {
      mediaQueryList.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}
