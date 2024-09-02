// import { StateCreator } from 'zustand';
// import { ResponseSlice } from './types';

// export const responseSlice: StateCreator<
//   ResponseSlice,
//   [['zustand/immer', never], ['zustand/devtools', never]]
// > = (set) => ({
//   activeHistoryResponseTraceId: null,
//   activeResponse: null,
//   showResponseBodyFromHistory: (traceId) => set((state) => {
//     state.activeHistoryResponseTraceId = traceId;
//     state.activeResponse = null;
//   }),
//   clearResponseBodyFromHistory: () => set((state) => {
//     state.activeHistoryResponseTraceId = null;
//   }),
//   setActiveResponse: (response) => set((state) => {
//     state.activeResponse = response;
//   }),
// });
