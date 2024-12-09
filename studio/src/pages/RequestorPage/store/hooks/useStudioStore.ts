import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import {
  type StudioStore,
  aiSlice,
  requestResponseSlice,
  routesSlice,
  tabsSlice,
  uiSlice,
  websocketSlice,
} from "../slices";

export function useStudioStore<
  T extends StudioStore,
  K extends keyof StudioStore,
>(...items: Array<K>): Pick<T, K> {
  const obj = useStudioStoreRaw(
    useShallow((state) => {
      const result = {} as Pick<T, K>;
      for (const item of items) {
        result[item as K] = state[item] as T[K];
      }

      return result;
    }),
  );

  return obj as Pick<T, K>;
}

export const useStudioStoreRaw = create<StudioStore>()(
  devtools(
    immer((...a) => ({
      ...routesSlice(...a),
      ...websocketSlice(...a),
      ...tabsSlice(...a),
      ...requestResponseSlice(...a),
      ...uiSlice(...a),
      ...aiSlice(...a),
    })),
    { name: "StudioStore" },
  ),
);

// Provide a way to get the store state outside of a component
export const getStudioStoreState = useStudioStoreRaw.getState;
