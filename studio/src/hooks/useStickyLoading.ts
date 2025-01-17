import { useEffect, useState } from "react";

/**
 * Makes the loading state sticky (for a minimum duration)
 */
export function useStickyLoading(loading: boolean, duration = 300) {
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    if (loading) {
      setSticky(true);
      return;
    }

    const timeout = setTimeout(() => {
      setSticky(false);
    }, duration);
    return () => clearTimeout(timeout);
  }, [loading, duration]);

  return sticky || loading;
}
