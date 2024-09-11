import { Fragment } from "react";
import { useHandler, useKeyPressEvent } from "@fiberplane/hooks";
import { useNavigate } from "react-router-dom";
import { shell } from "@tauri-apps/api";
import { useEffect } from "react";

const runningInTauri = isTauri();

export function Tauri() {
  const navigate = useNavigate();

  const handleSettings = useHandler((event: KeyboardEvent) => {
    if (!runningInTauri && !event.metaKey) {
      return;
    }

    navigate("/settings");
  });

  useKeyPressEvent(",", handleSettings);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return <Fragment />;
}

function handleClick(event: MouseEvent) {
  if (!runningInTauri) {
    return;
  }

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

function isTauri() {
  return "__TAURI__" in window;
}
