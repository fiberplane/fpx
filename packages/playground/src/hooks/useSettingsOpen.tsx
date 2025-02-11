import { useHandler } from "@fiberplane/hooks";
import { useNavigate, useSearch } from "@tanstack/react-router";

export function useSettingsOpen() {
  const navigate = useNavigate();
  const { settings = false } = useSearch({
    strict: false,
  });

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
