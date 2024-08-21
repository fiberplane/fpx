import {
  type Settings,
  type SettingsKey,
  SettingsSchema,
} from "@fiberplane/fpx-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

const FPX_USER_SETTINGS_QUERY_KEY = "FPX_USER_SETTINGS";

export function useFetchSettings() {
  return useQuery({
    queryKey: [FPX_USER_SETTINGS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch("/v0/settings");
      const json = await response.json();
      return SettingsSchema.parse(json);
    },
  });
}

export function useSetting<T extends SettingsKey>(key: T) {
  const { data } = useFetchSettings();
  return useMemo(() => {
    if (data && data[key]) {
      return data[key];
    }
  }, [data, key]);
}

async function updateSettings({ content }: { content: Settings }) {
  const response = await fetch("/v0/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });

  return (await response.json()) as Settings;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      // Invalidate and refetch requestor requests
      queryClient.invalidateQueries({
        queryKey: [FPX_USER_SETTINGS_QUERY_KEY],
      });
    },
  });

  return mutation;
}
