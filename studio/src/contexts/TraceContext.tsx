import type React from "react";
import { createContext, useContext, useState } from "react";

type TraceContextType = {
  currentTraceId: string | null;
  setCurrentTraceId: (id: string | null) => void;
};

const TraceContext = createContext<TraceContextType | null>(null);

export function TraceProvider({ children }: { children: React.ReactNode }) {
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);
  return (
    <TraceContext.Provider value={{ currentTraceId, setCurrentTraceId }}>
      {children}
    </TraceContext.Provider>
  );
}

export const useTraceContext = () => {
  const context = useContext(TraceContext);
  if (!context) {
    throw new Error("useTraceContext must be used within a TraceProvider");
  }
  return context;
};
