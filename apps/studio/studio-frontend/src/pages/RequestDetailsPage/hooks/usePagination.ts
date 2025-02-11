import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";

export function usePagination({
  traceId,
  findIndex,
  getTraceRoute,
  maxIndex,
}: {
  findIndex: (id: string) => number | undefined;
  traceId: string;
  maxIndex: number;
  getTraceRoute: (index: number) => string;
}) {
  const navigate = useNavigate();
  const currentIndex = findIndex(traceId) || 0;

  const handleNextTrace = useCallback(() => {
    if (currentIndex === undefined) {
      return;
    }

    if (currentIndex === maxIndex) {
      return;
    }

    const route = getTraceRoute(currentIndex + 1);
    navigate(route);
  }, [currentIndex, navigate, getTraceRoute, maxIndex]);

  const handlePrevTrace = useCallback(() => {
    if (currentIndex === undefined) {
      return;
    }
    if (currentIndex === 0) {
      return;
    }

    const route = getTraceRoute(currentIndex - 1);
    navigate(route);
  }, [currentIndex, navigate, getTraceRoute]);

  useHotkeys(["J"], () => {
    handleNextTrace();
  });

  useHotkeys(["K"], () => {
    handlePrevTrace();
  });

  return {
    currentIndex,
    maxIndex,
    handleNextTrace,
    handlePrevTrace,
  };
}
