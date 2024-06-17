import { useEffect, useState } from "react";

export function useHandlerSourceCode(source?: string, handler?: string) {
  const [handlerSourceCode, setHandlerSourceCode] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!source) {
      return;
    }
    if (!handler) {
      return;
    }
    const query = new URLSearchParams({
      source,
      handler,
    });
    const fetchSourceLocation = async () => {
      try {
        const pos = await fetch(`/v0/source-function?${query.toString()}`, {
          method: "POST",
        }).then((r) => {
          if (!r.ok) {
            throw new Error(
              `Failed to fetch source location from source map: ${r.status}`,
            );
          }
          return r.json().then((r) => setHandlerSourceCode(r.functionText));
        });
        return pos;
      } catch (err) {
        console.debug("Could not fetch source location from source map", err);
        return null;
      }
    };

    fetchSourceLocation();
  }, [handler, source]);

  return handlerSourceCode;
}
