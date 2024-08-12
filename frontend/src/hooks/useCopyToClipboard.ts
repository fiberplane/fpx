import { useCallback, useState } from "react";

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    if (!navigator.clipboard) {
      console.error("Clipboard API not available");
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset the copied state after 2 seconds
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      },
    );
  }, []);

  return {
    /**
     * isCopied - resets to false after 2 seconds
     */
    isCopied,
    copyToClipboard,
  };
}
