import type { MizuOrphanLog } from "@/queries";
import {
  cn,
  objectHasName,
  objectHasStack,
  renderFullLogMessage,
} from "@/utils";
import { SubSectionHeading } from "../shared";
import { getBgColorForLevel, getTextColorForLevel } from "../utils";
import { StackTrace } from "./StackTrace";
import { Icon } from "@iconify/react";

export function OrphanLog({ log }: { log: MizuOrphanLog }) {
  const id = log.id;
  const { level, message } = log;
  const name = objectHasName(message) ? message.name : null;

  const levelWithDefensiveFallback = level || "info";
  const consoleMethod = levelWithDefensiveFallback === "info" ? "log" : level;

  const heading = `${consoleMethod}${name ? `:  ${name}` : ""}`;

  const { type: contentsType, value: contents } = getLogContents(
    message ?? "",
    log.args,
  );
  const description = getDescription(message ?? "", log.args);
  // TODO - Get stack from the span!
  const stack = objectHasStack(message) ? message.stack : null;
  const textColorLevel = getTextColorForLevel(level);
  const bgColorLevel = getBgColorForLevel(level);
  // const icon = useTimelineIcon(log, {
  //   colorOverride: getColorForLevel(log.level),
  // });

  const hasDescription = !!description;

  const topContent = hasDescription ? (
    <div className="font-mono text-xs">{description}</div>
  ) : contentsType === "multi-arg-log" ? (
    <LogContents className="px-0 text-xs" fullLogArgs={contents} />
  ) : contentsType === "json" ? (
    <LogContents className="px-0 text-xs" fullLogArgs={contents} />
  ) : stack ? (
    <div className="mt-2 max-h-[200px] overflow-y-auto text-gray-400 text-xs">
      <StackTrace stackTrace={stack} />
    </div>
  ) : (
    <div />
  );

  return (
    <div
      id={id?.toString()}
      className={cn(
        "overflow-x-auto overflow-y-hidden max-w-full px-2",
        bgColorLevel,
      )}
    >
      <div className={cn("grid gap-1 grid-cols-[auto_1fr_auto] items-center")}>
        <Icon icon="lucide:terminal" className={textColorLevel} />
        {topContent}

        <SubSectionHeading
          className={cn(
            "font-semibold text-sm flex items-center gap-2",
            textColorLevel,
          )}
        >
          {heading}
        </SubSectionHeading>
      </div>

      {hasDescription && contentsType === "multi-arg-log" && (
        <LogContents className="text-xs" fullLogArgs={contents} />
      )}

      {hasDescription && contentsType === "json" && (
        <LogContents className="text-xs" fullLogArgs={contents} />
      )}

      {stack && (
        <div className="max-h-[200px] overflow-y-auto text-gray-400 text-xs">
          <StackTrace stackTrace={stack} />
        </div>
      )}
    </div>
  );
}

function getDescription(message: string, args?: Array<unknown>) {
  if (!message) {
    return "";
  }
  // TODO - Render a smarter message
  if (argsIsNotEmpty(args)) {
    return "";
  }
  if (typeof message === "string") {
    return message;
  }
  return "";
}

function getLogContents(message: string, args?: Array<unknown>) {
  if (!message && argsIsEmpty(args)) {
    return { type: "empty" as const, value: null };
  }

  if (argsIsNotEmpty(args)) {
    return { type: "multi-arg-log" as const, value: [message, ...args] };
  }

  if (typeof message === "string") {
    return { type: "string" as const, value: message };
  }

  return {
    type: "json" as const,
    value: [message],
  };
}

type Props = {
  fullLogArgs: Array<unknown>;
  className?: string;
};

// TODO - Use something like util.inspect but for the frontend
const LogContents = ({ fullLogArgs, className }: Props) => {
  const content = renderFullLogMessage(fullLogArgs);

  return (
    <code
      className={cn(
        "p-2 rounded bg-slate-950/10 text-mono whitespace-pre",
        className,
      )}
    >
      {content}
    </code>
  );
};

function argsIsEmpty(args?: Array<unknown>) {
  return !args || args.length === 0;
}

function argsIsNotEmpty(args?: Array<unknown>): args is Array<unknown> {
  return !argsIsEmpty(args);
}
