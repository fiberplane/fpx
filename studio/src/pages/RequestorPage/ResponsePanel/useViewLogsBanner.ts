import { useEffect, useState } from "react";

/**
 * This is a local storage flag to hide the banner that shows up when the user makes a request.
 * This is used to prevent the banner from showing up after the user hits "Ignore" once.
 *
 * - Default value: false, don't ignore the banner
 * - Value if the localStorage contents are not json parseable: true, ignore the banner
 *
 * TODO - Persist this in the API instead
 */
export function useIgnoreViewLogsBanner() {
  const LOCAL_STORAGE_KEY = "ignoreViewLogsBanner";

  const [ignoreViewLogsBanner, setIgnoreViewLogsBanner] = useState<boolean>(
    () => {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
      try {
        return storedValue ? JSON.parse(storedValue) : false;
      } catch (e) {
        console.error("Failed to parse stored value:", e);
        return true;
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(ignoreViewLogsBanner),
    );
  }, [ignoreViewLogsBanner]);

  return {
    ignoreViewLogsBanner,
    setIgnoreViewLogsBanner,
  };
}
