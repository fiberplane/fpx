import { Status } from "@/components/ui/status";
import {
  MizuTraceV2,
  isMizuFetchSpan,
  isMizuLog,
  isMizuRootRequestSpan,
} from "@/queries";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequestMethod } from "../shared";
import { TocItemV2 } from "./TocItemV2";

export function MinimapV2({ trace }: { trace?: MizuTraceV2 }) {
  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver>();

  const toc: TocItemV2[] = useMemo(() => {
    if (!trace) {
      return [];
    }
    return trace.waterfall
      .map((log) => {
        const { message } = log;
        if (isMizuRootRequestSpan(log)) {
          const span = log;
          const { method } = span.logs[0].message;
          return {
            id: "root-request",
            title: `${method?.toUpperCase()} Request`,
          };
        }

        if (isMizuFetchSpan(log)) {
          const span = log;
          const { url, requestId, method } = span.logs[0].message;
          return {
            id: `fetch-request-${requestId}`,
            title: `Fetch: ${url}`,
            indent: 1,
            method,
          };
        }

        if (isMizuLog(log) && typeof log.message === "string") {
          const { level, message } = log;
          return {
            id: `log-${level}-${log.id}`,
            title: `console.${level ? level : "error"}: ${truncateMessage(message)}`,
            indent: 1,
          };
        }

        // FIXME
        if (
          message &&
          typeof message === "object" &&
          ("level" in log || "name" in message)
        ) {
          return {
            id: `log-${log.level}-${message.name}-${log.id}`,
            title: `console.${log.level ? log.level : "error"}: ${message.message}`,
            indent: 1,
          };
        }
      })
      .filter((item) => item !== undefined) as TocItemV2[];
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

function truncateMessage(message: string | null, maxLength = 30) {
  if (message === null) {
    return null;
  }
  return message.length > maxLength
    ? `${message.slice(0, maxLength)}...`
    : message;
}
