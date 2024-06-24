import React, { createContext, useContext, useState, ReactNode } from "react";

type RequestorTraceId = string;

type SessionHistoryContextType = {
  sessionHistory: RequestorTraceId[];
  recordRequestInSessionHistory: (traceId: RequestorTraceId) => void;
};

const SessionHistoryContext = createContext<
  SessionHistoryContextType | undefined
>(undefined);

const RequestorSessionHistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sessionHistory, setSessionHistoryTraceIds] = useState<
    RequestorTraceId[]
  >([]);

  const recordRequestInSessionHistory = (traceId: RequestorTraceId) => {
    setSessionHistoryTraceIds((currentSessionHistory) => [
      traceId,
      ...currentSessionHistory,
    ]);
  };

  return (
    <SessionHistoryContext.Provider
      value={{ sessionHistory, recordRequestInSessionHistory }}
    >
      {children}
    </SessionHistoryContext.Provider>
  );
};

const useSessionHistory = () => {
  const context = useContext(SessionHistoryContext);
  if (!context) {
    throw new Error(
      "useSessionHistory must be used within a SessionHistoryProvider",
    );
  }
  return context;
};

export { RequestorSessionHistoryProvider, useSessionHistory };
