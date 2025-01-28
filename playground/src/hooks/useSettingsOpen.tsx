import { Route } from "@/routes";
import { useHandler } from "@fiberplane/hooks";
import { useNavigate } from "@tanstack/react-router";

export function useSettingsOpen() {
  const navigate = useNavigate();
  const { settings = false } = Route.useSearch();

  const setSettingsOpen = useHandler((open: boolean) => {
    if (open === settings) {
      return;
    }

    navigate({
      to: ".",
      search: (value) => {
        const { settings, ...rest } = value;
        if (open) {
          return {
            ...rest,
            settings: open,
          };
        }

        return rest;
      },
      replace: true,
    });
  });

  return {
    settingsOpen: settings,
    setSettingsOpen,
  };
}
