// import { SessionHistoryContext } from "./RequestorSessionHistoryContext";
import { useShallow } from "zustand/react/shallow";
// import { useContext } from "react";
import { useRequestorStore } from "../store";

export const useSessionHistory = () => {
  return useRequestorStore(
    useShallow(({ sessionHistory, recordRequestInSessionHistory }) => ({
      sessionHistory,
      recordRequestInSessionHistory,
    })),
  );
  // const context = useContext(SessionHistoryContext);
  // if (!context) {
  //   throw new Error(
  //     "useSessionHistory must be used within a SessionHistoryProvider",
  //   );
  // }
  // return context;
};
