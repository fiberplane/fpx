import { useState } from "react";

export const useShake = () => {
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 700); // Duration of the shake animation
  };

  const shakeClassName = isShaking ? "animate-shake" : "";

  return { triggerShake, shakeClassName };
};
