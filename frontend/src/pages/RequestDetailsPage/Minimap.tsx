import { Status } from "@/components/ui/status";
import {
  MizuTrace,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchLoggingErrorMessage,
  isMizuFetchStartMessage,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
} from "@/queries";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TocItem } from "./RequestDetailsPage";
import { fpxLogId } from "./minimapIdUtils"; // Import the utility function
import { RequestMethod } from "./shared";

export function Minimap({ trace }: { trace: MizuTrace | undefined }) {
  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver>();

  const toc: TocItem[] = useMemo(() => {
    if (!trace) {
      return [];
    }
    return trace.logs
      .map((log) => {
        const id = fpxLogId(log); // Use the utility function to generate the ID
        const { message } = log;

        if (isMizuRequestStartMessage(message)) {
          return {
            id,
            title: "Request",
            method: message.method,
          };
        }
        if (isMizuRequestEndMessage(message)) {
          return {
            id,
            title: "Response",
            status: message.status,
          };
        }
        if (isMizuFetchStartMessage(message)) {
          return {
            id,
            title: "Fetch Request",
            method: message.method,
          };
        }
        if (isMizuFetchEndMessage(message)) {
          return {
            id,
            title: "Fetch Response",
            status: message.status,
          };
        }
        if (isMizuFetchErrorMessage(message)) {
          return {
            id,
            title: "Fetch Response Error",
            status: message.status,
          };
        }
        if (isMizuFetchLoggingErrorMessage(message)) {
          return {
            id,
            title: "Fetch Request Failed",
          };
        }
        if (
          message &&
          typeof message === "object" &&
          ("level" in log || "name" in message)
        ) {
          return {
            id,
            title: `console.${log.level ? log.level : "error"}: ${message.message}`,
          };
        }
      })
      .filter((item) => item !== undefined) as TocItem[];
  }, [trace]);

  // Scroll minimap item into view if it is out of viewport
  useEffect(() => {
    const element = document.querySelector(`[data-toc-id="${activeId}"]`);
    let timeoutId: ReturnType<typeof setTimeout>;

    if (element) {
      timeoutId = setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [activeId]);

  const handleObserve = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id);
      }
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserve, {
      // TODO - This might need more tweaking
      rootMargin: "0px 0px -33% 0px",
    });

    const { current: currentObserver } = observer;

    for (const item of toc) {
      const element = document.getElementById(item.id);
      if (element) {
        currentObserver.observe(element);
      }
    }

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [toc, handleObserve]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto">
      {toc.length > 0 &&
        toc.map((item, idx) => (
          <div
            key={idx}
            data-toc-id={item.id}
            className={clsx("border-l-2", {
              "border-l-blue-800": activeId === item.id,
              "border-l-gray-800": activeId !== item.id,
            })}
          >
            <div
              className={clsx("ml-4 px-4 py-2 rounded", {
                "bg-muted": activeId === item.id,
              })}
            >
              <a
                href={`#${item.id}`}
                className="flex gap-2 items-center text-sm"
              >
                <span className="">{item.title}</span>
                {item.status && <Status statusCode={Number(item.status)} />}
                {item.method && <RequestMethod method={item.method} />}
              </a>
            </div>
          </div>
        ))}
    </div>
  );
}
