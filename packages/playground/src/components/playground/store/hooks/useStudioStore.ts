import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import {
  type StudioState,
  requestResponseSlice,
  routesSlice,
  settingsSlice,
  tabsSlice,
  uiSlice,
} from "../slices";

export function useStudioStore<
  T extends StudioState,
  K extends keyof StudioState,
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

export const useStudioStoreRaw = create<StudioState>()(
  devtools(
    immer((...a) => ({
      ...routesSlice(...a),
      ...tabsSlice(...a),
      ...requestResponseSlice(...a),
      ...uiSlice(...a),
      ...settingsSlice(...a),
    })),
    { name: "StudioStore" },
  ),
);

// Provide a way to get the store state outside of a component
export const getStudioStoreState = useStudioStoreRaw.getState;
