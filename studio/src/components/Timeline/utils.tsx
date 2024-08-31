import AnthropicLogo from "@/assets/AnthropicLogo.svg";
import Database from "@/assets/Database.svg";
import HonoLogo from "@/assets/HonoLogo.svg";
import NeonLogo from "@/assets/NeonLogo.svg";
import OpenAiLogo from "@/assets/OpenAILogo.svg";
import { SpanKind } from "@/constants";
import type { Waterfall } from "@/utils";
import { CommitIcon, PaperPlaneIcon, TimerIcon } from "@radix-ui/react-icons";
import { formatDistanceStrict } from "date-fns";

export const getTypeIcon = (type: string, colorOverride = "") => {
  switch (type) {
    case "request":
    case "SERVER":
    case SpanKind.SERVER:
      return <HonoLogo className={`w-3.5 h-3.5 ${colorOverride}`} />;
    case "CLIENT":
    case SpanKind.CLIENT:
    case "fetch":
      return (
        <PaperPlaneIcon
          className={`w-3.5 h-3.5 ${colorOverride || "text-blue-500"}`}
        />
      );
    case "log":
      return (
        <CommitIcon
          className={`w-3.5 h-3.5 rotate-90 ${colorOverride || "text-gray-400"}`}
        />
      );
    // return <Diamond className={`w-3.5 h-3.5 text-orange-400 ${className}`} />;
    // NOT IN USE
    case "db":
      return (
        <Database
          className={`w-3.5 h-3.5 ${colorOverride || "text-blue-500"}`}
        />
      );
    case "neon":
      return (
        <NeonLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-blue-500"}`}
        />
      );
    case "openai":
      return (
        <OpenAiLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-blue-500"}`}
        />
      );
    case "anthropic":
      return (
        <AnthropicLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-blue-500"}`}
        />
      );
    default:
      return (
        <TimerIcon
          className={`w-3.5 h-3.5 ${colorOverride || "text-blue-500"}`}
        />
      );
    // return "🔸";
  }
};

export function getColorForLevel(level: string) {
  switch (level) {
    case "info":
      return "text-muted-foreground";
    case "warn":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export const formatDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60 * 1000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  const duration = formatDistanceStrict(startDate, endDate, {
    unit: "minute",
  });

  return duration
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m");
};

export function extractWaterfallTimeStats(waterfall: Waterfall) {
  const startTime = Math.min(
    ...waterfall.map((item) => {
      const time = "span" in item ? item.span.start_time : item.timestamp;
      return new Date(time).getTime();
    }),
  );
  const endTime = Math.max(
    ...waterfall.map((item) => {
      const time = "span" in item ? item.span.end_time : item.timestamp;
      return new Date(time).getTime();
    }),
  );

  return {
    minStart: startTime,
    // NOTE - `duration` could be 0
    duration: endTime - startTime,
  };
}

export function getHttpMethodTextColor(method: string) {
  return {
    GET: "text-blue-500",
    POST: "text-yellow-500",
    PUT: "text-orange-500",
    PATCH: "text-orange-500",
    DELETE: "text-red-500",
    OPTIONS: "text-blue-300",
    HEAD: "text-gray-400",
    WS: "text-green-500",
  }[String(method).toUpperCase()];
}
