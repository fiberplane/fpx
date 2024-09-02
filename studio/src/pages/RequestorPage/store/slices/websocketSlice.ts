import { StateCreator } from 'zustand';
import { Store, WebsocketSlice } from './types';
// import { RequestorState } from '../index';
// import { devtools } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer';

export const websocketSlice: StateCreator<
  WebsocketSlice,
  [
    ['zustand/immer', never],
    ['zustand/devtools', never]
  ]
> = (set) =>
  ({
    websocketMessage: '',
    setWebsocketMessage: (websocketMessage) => set((state) => {
      state.websocketMessage = websocketMessage ?? '';
    }),
  });
