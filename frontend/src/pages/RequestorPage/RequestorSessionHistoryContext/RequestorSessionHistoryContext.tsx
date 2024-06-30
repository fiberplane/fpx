/**
 * This file contains the context and provider for the session history of the requestor.
 * By session history, we mean the list of traceIds that the requestor has created,
 * _during the current lifetime of the tab/browser window_.
 *
 * Using context for this allows us to persist the "session history" of the requestor
 * across different pages of the app.
 *
 * If the user refreshes the page, the session history will be cleared.
 *
 */

import React, { createContext, useState, ReactNode } from "react";

type RequestorTraceId = string;

type SessionHistoryContextType = {
  sessionHistory: RequestorTraceId[];
  recordRequestInSessionHistory: (traceId: RequestorTraceId) => void;
};

export const SessionHistoryContext = createContext<
  SessionHistoryContextType | undefined
>(undefined);

export const RequestorSessionHistoryProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
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
