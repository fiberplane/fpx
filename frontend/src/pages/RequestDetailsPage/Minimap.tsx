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
import { cn } from "@/utils";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getHttpMethodTextColor } from "../RequestorPage/method";
import { RequestMethod } from "./Method";
import { TocItem } from "./RequestDetailsPage";

export function Minimap({ trace }: { trace: MizuTrace | undefined }) {
  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver>();

  const toc: TocItem[] = useMemo(() => {
    if (!trace) {
      return [];
    }
    return trace.logs
      .map((log) => {
        const { message } = log;
        // console.log("message", message);
        if (isMizuRequestStartMessage(message)) {
          return {
            id: `request-${message.method}-${message.path}`,
            title: "Request",
            method: message.method,
          };
        }
        if (isMizuRequestEndMessage(message)) {
          return {
            id: `response-${message.status}-${message.path}`,
            title: "Response",
            status: message.status,
          };
        }
        if (isMizuFetchStartMessage(message)) {
          return {
            id: `fetch-request-${message.method}-${message.url}`,
            title: "Fetch Request",
            method: message.method,
          };
        }
        if (isMizuFetchEndMessage(message)) {
          return {
            id: `fetch-response-${message.status}-${message.url}`,
            title: "Fetch Response",
            status: message.status,
          };
        }
        if (isMizuFetchErrorMessage(message)) {
          return {
            id: `fetch-response-error-${message.status}-${message.url}`,
            title: "Fetch Response Error",
            status: message.status,
          };
        }
        if (isMizuFetchLoggingErrorMessage(message)) {
          return {
            id: `fetch-request-error-${message.url}`,
            title: "Fetch Request Failed",
          };
        }
        if (
          message &&
          typeof message === "object" &&
          ("level" in log || "name" in message)
        ) {
          return {
            id: `log-${log.level}-${message.name}`,
            title: `console.${log.level ? log.level : "error"}: ${message.message}`,
          };
        }
      })
      .filter((item) => item !== undefined);
  }, [trace]);

  const handleObserve = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id);
      }
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserve, {
      rootMargin: "-33% 0px 0px 0px",
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
    <div className="flex flex-col">
      {toc.length > 0 &&
        toc.map((item, idx) => (
          <div
            key={idx}
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
