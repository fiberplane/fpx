import { createContext, useContext, useState } from "react";

type TimelineContextType = {
  highlightedSpanId: string | null;
  setHighlightedSpanId: (spanId: string | null) => void;
};

export const TimelineContext = createContext<TimelineContextType | null>(null);

export const useTimelineContext = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error(
      "useTimelineContext must be used within a TimelineProvider",
    );
  }
  return context;
};

export const TimelineProvider = ({
  children,
}: { children: React.ReactNode }) => {
  const [highlightedSpanId, setHighlightedSpanId] = useState<string | null>(
    null,
  );

  return (
    <TimelineContext.Provider
      value={{ highlightedSpanId, setHighlightedSpanId }}
    >
      {children}
    </TimelineContext.Provider>
  );
};
