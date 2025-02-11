import AnthropicLogo from "@/assets/AnthropicLogo.svg";
import CloudflareAiLogo from "@/assets/CloudflareAILogo.svg";
import CloudflareD1Logo from "@/assets/CloudflareD1Logo.svg";
import CloudflareKVLogo from "@/assets/CloudflareKVLogo.svg";
import CloudflareR2Logo from "@/assets/CloudflareR2Logo.svg";
import Database from "@/assets/Database.svg";
import HonoLogo from "@/assets/HonoLogo.svg";
import NeonLogo from "@/assets/NeonLogo.svg";
import OpenAiLogo from "@/assets/OpenAILogo.svg";
import { CF_BINDING_METHOD, SpanKind } from "@/constants";
import { type CloudflareVendorInfo, type Waterfall, getString } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
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
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "log":
      return (
        <CommitIcon
          className={`w-3.5 h-3.5 rotate-90 ${colorOverride || "text-foreground/70"}`}
        />
      );
    // return <Diamond className={`w-3.5 h-3.5 text-orange-400 ${className}`} />;
    // NOT IN USE
    case "db":
      return (
        <Database
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "neon":
      return (
        <NeonLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-success"}`}
        />
      );
    case "openai":
      return (
        <OpenAiLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "anthropic":
      return (
        <AnthropicLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "cloudflare-ai":
      return (
        <CloudflareAiLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "cloudflare-d1":
      return (
        <CloudflareD1Logo
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "cloudflare-kv":
      return (
        <CloudflareKVLogo
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    case "cloudflare-r2":
      return (
        <CloudflareR2Logo
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    default:
      return (
        <TimerIcon
          className={`w-3.5 h-3.5 ${colorOverride || "text-primary"}`}
        />
      );
    // return "🔸";
  }
};

// NOTE: can't use a generic *-yellow-500 because transparency modifiers are
// resolved before the color is applied and tailwind borks
export function getBgColorForLevel(level: string) {
  switch (level) {
    case "info":
      return "bg-muted/50";
    case "warn":
      return "bg-warning/5";
    case "error":
      return "bg-destructive/5";
    default:
      return "bg-muted/50";
  }
}

export function getTextColorForLevel(level: string) {
  switch (level) {
    case "info":
      return "text-muted-foreground";
    case "warn":
      return "text-yellow-500";
    case "error":
      return "text-danger";
    default:
      return "text-foreground/70";
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

export function getCloudflareSpanName(
  span: Pick<OtelSpan, "attributes">,
  vendorInfo: CloudflareVendorInfo,
) {
  const { type } = vendorInfo;
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  return type === "d1" ? "D1 Query" : `${type.toUpperCase()}.${method}`;
}
