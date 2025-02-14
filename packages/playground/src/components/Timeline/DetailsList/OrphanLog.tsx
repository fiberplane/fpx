import { getIconColor } from "@/components/Log";
import type { MizuOrphanLog } from "@/types";
import { cn, objectHasStack, renderFullLogMessage } from "@/utils";
import { StackTrace } from "./StackTrace";

export function OrphanLog({ log }: { log: MizuOrphanLog }) {
  const id = log.id;
  const { message } = log;

  const { type: contentsType, value: contents } = getLogContents(
    message ?? "",
    log.args,
  );
  const description = getDescription(message ?? "", log.args);
  // TODO - Get stack from the span!
  const stack = objectHasStack(message) ? message.stack : null;

  const hasDescription = !!description;

  const topContent = hasDescription ? (
    <div className="font-mono text-xs text-ellipsis overflow-hidden">
      {description}
    </div>
  ) : contentsType === "multi-arg-log" ? (
    <LogContents
      className="px-0 text-xs  text-ellipsis overflow-hidden"
      fullLogArgs={contents}
    />
  ) : contentsType === "json" ? (
    <LogContents
      className="px-0 text-xs text-ellipsis overflow-hidden"
      fullLogArgs={contents}
    />
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
      className={cn("overflow-x-auto overflow-y-hidden max-w-full px-2")}
    >
      <div
        className={cn(
          "grid gap-1 grid-cols-[16px_auto_min-content] max-w-full items-center",
        )}
      >
        <div className="flex items-center justify-center">
          <div
            className={`w-2 h-2 mr-2 flex-shrink-0 rounded-[15%] ${getIconColor(log.level)}`}
          />
        </div>
        {topContent}
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
