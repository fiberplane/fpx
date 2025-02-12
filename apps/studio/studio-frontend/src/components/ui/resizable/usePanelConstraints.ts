import { useHandler } from "@fiberplane/hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { getPanelGroupElement } from "react-resizable-panels";

type PanelConstraintOptions = {
  groupId: string;
  minPixelSize?: number;
  maxPixelSize?: number;
  /**
   * The initial estimated size of the panel in pixels.
   */
  initialGroupSize: number;
  /**
   * The minimum size of the panel in pixels. If the panel is
   * not big enough, there won't be any min/max value applied.
   */
  minimalGroupSize?: number;

  dimension?: "width" | "height";
};

type SizeConstraint = {
  /* Size in percentages. If set to undefined, the panel group wasn't big engouh */
  minSize?: number;
  maxSize?: number;
};

/**
 * This function determines the min/max size of a panel group based on the
 * initial size of the panel group and the min/max pixel size for a panel
 *
 * Note: it is assumed the panel is a horizontal panel group
 */
export function usePanelConstraints(
  options: PanelConstraintOptions,
): SizeConstraint {
  const {
    groupId,
    initialGroupSize,
    maxPixelSize,
    minPixelSize,
    minimalGroupSize,
    dimension = "width",
  } = options;

  const getConstraint = useHandler((size: number) => {
    if (minimalGroupSize && size < minimalGroupSize) {
      return {};
    }
    const minSize = minPixelSize ? (minPixelSize / size) * 100 : undefined;
    const maxSize = maxPixelSize ? (maxPixelSize / size) * 100 : maxPixelSize;

    return {
      minSize,
      maxSize,
    };
  });

  const [current, setCurrent] = useState(() => getConstraint(initialGroupSize));

  const updateCurrent = useHandler((size: number) => {
    const result = getConstraint(size);
    if (
      result.minSize !== current.minSize ||
      result.maxSize !== current.maxSize
    ) {
      setCurrent(result);
    }
  });

  const debouncedUpdateCurrent = useMemo(() => {
    return debounce(updateCurrent, (1 / 30) * 1000);
  }, [updateCurrent]);

  useLayoutEffect(() => {
    const group = getPanelGroupElement(groupId);
    if (!group) {
      return;
    }

    if (!group) {
      console.warn("Unable to find the group");
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const size = entries[0].contentRect[dimension];
      debouncedUpdateCurrent(size);
    });
    observer.observe(group);

    // Trigger the initial update
    updateCurrent(group.offsetWidth);

    return () => {
      observer.disconnect();
    };
  }, [groupId, updateCurrent, debouncedUpdateCurrent, dimension]);

  return current;
}

function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
) {
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
