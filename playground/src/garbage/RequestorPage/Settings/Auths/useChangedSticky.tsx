import { useRef, useState, useEffect } from "react";

/**
 * Keeps track if value has changed and if so, return true for `duration` amount of time (ms)
 */
export function useChangedSticky<T>(value: T, duration = 300) {
  const valueRef = useRef(value);

  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (valueRef.current !== value) {
      setChanged(true);

      const timeout = setTimeout(() => {
        setChanged(false);
      }, duration);
      valueRef.current = value;
      return () => clearTimeout(timeout);
    }

  }, [value, duration]);

  return changed;
}
