import { isTauri } from "@/utils";
import { useHandler, useKeyPressEvent } from "@fiberplane/hooks";
import { useNavigate } from "react-router-dom";
import { shell } from "@tauri-apps/api";
import { useEffect } from "react";

export function useTauri() {
  const inTauri = isTauri();
  const navigate = useNavigate();

  const handleSettings = useHandler((event: KeyboardEvent) => {
    if (!inTauri && !event.metaKey) {
      return;
    }

    navigate("/settings");
  });

  useKeyPressEvent(",", handleSettings);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);
}

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;

  if (!(target instanceof HTMLAnchorElement)) {
    return;
  }

  if (target.tagName === "A" && target.target === "_blank") {
    event.preventDefault();

    shell
      .open(target.href)
      .catch((err) => console.error("Failed to open URL:", err));
  }
}
