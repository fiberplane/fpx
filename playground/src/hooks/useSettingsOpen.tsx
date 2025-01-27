import { Route } from "@/routes";
import { useHandler } from "@fiberplane/hooks";
import { useNavigate } from "@tanstack/react-router";

export function useSettingsOpen() {
  const navigate = useNavigate();
  const { settings = false } = Route.useSearch();

  const setSettingsOpen = useHandler((open: boolean) => {
    navigate({
      to: ".",
      search: (value) => {
        const { settings, ...rest } = value;
        if (value) {
          // rest['settings'] = open;
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
