import { useHandler } from "@fiberplane/hooks";
import { useState } from "react";

export const useShake = () => {
  const [isShaking, setIsShaking] = useState(false);

  // This function will trigger the shake animation
  // wrapped in useHandler so its a stable reference
  const triggerShake = useHandler(() => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 700); // Duration of the shake animation
  });

  const shakeClassName = isShaking ? "animate-shake" : "";

  return { triggerShake, shakeClassName };
};
