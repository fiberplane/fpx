import { useContext } from "react";
import { SessionHistoryContext } from "./RequestorSessionHistoryContext";

export const useSessionHistory = () => {
  const context = useContext(SessionHistoryContext);
  if (!context) {
    throw new Error(
      "useSessionHistory must be used within a SessionHistoryProvider",
    );
  }
  return context;
};
