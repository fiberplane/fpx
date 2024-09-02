// import { useContext } from "react";
import { useRequestorStore } from "../store";
// import { SessionHistoryContext } from "./RequestorSessionHistoryContext";

export const useSessionHistory = () => {
  return useRequestorStore(
    ({ sessionHistory, recordRequestInSessionHistory }) => ({
      sessionHistory,
      recordRequestInSessionHistory,
    }),
  );
  // const context = useContext(SessionHistoryContext);
  // if (!context) {
  //   throw new Error(
  //     "useSessionHistory must be used within a SessionHistoryProvider",
  //   );
  // }
  // return context;
};
