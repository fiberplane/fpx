import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { ResizeCallbackData } from "react-resizable";

export function useResizableWidth(initialWidth: number, min = 200, max = 600) {
  const [width, setWidth] = useState(initialWidth);

  const getClampedWidth = useCallback(
    (newWidth: number) => {
      return Math.min(max, Math.max(newWidth, min));
    },
    [min, max],
  );

  const handleResize = useCallback(
    (_event: SyntheticEvent, { size }: ResizeCallbackData) => {
      setWidth(getClampedWidth(size.width));
    },
    [getClampedWidth],
  );

  return { width, handleResize };
}

export function useStyleWidth(width?: number) {
  return useMemo(() => (width ? { width: `${width}px` } : undefined), [width]);
}
