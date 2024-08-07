import { MizuMessage, MizuOrphanLog } from "@/queries";
import {
  cn,
  hasStringMessage,
  objectHasName,
  objectHasStack,
  renderFullLogMessage,
} from "@/utils";
import { StackTrace } from "../StackTrace";
import { SectionHeading } from "../shared";
// import { timelineId } from "./timelineId";
// import { SubSectionHeading } from "./shared";

export function OrphanLog({ log }: { log: MizuOrphanLog }) {
  // const id = timelineId(log);
  const id = log.id;
  const { level, message } = log;
  const name = objectHasName(message) ? message.name : null;

  const levelWithDefensiveFallback = level || "info";
  const consoleMethod = levelWithDefensiveFallback === "info" ? "log" : level;

  const heading = `console.${consoleMethod}${name ? `:  ${name}` : ""}`;

  const { type: contentsType, value: contents } = getLogContents(
    message,
    log.args,
  );
  const description = getDescription(message, log.args);
  const stack = objectHasStack(message) ? message.stack : null;

  return (
    <div id={id?.toString()} className="overflow-x-auto overflow-y-hidden">
      <div className={cn("grid gap-2 border-t py-4")}>
        <SectionHeading className="font-mono">{heading}</SectionHeading>
      </div>

      {description && <p className="p-2 font-mono">{description}</p>}

      {contentsType === "multi-arg-log" && (
        <LogContents fullLogArgs={contents} />
      )}
      {contentsType === "json" && <LogContents fullLogArgs={contents} />}

      {stack && (
        <div className="mt-2 max-h-[200px] overflow-y-auto text-gray-400">
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

// TODO - Use something like util.inspect but for the frontend
const LogContents = ({ fullLogArgs }: { fullLogArgs: Array<unknown> }) => {
  return (
    <code className="p-2 rounded bg-slate-950/10 text-mono whitespace-pre">
      {renderFullLogMessage(fullLogArgs)}
    </code>
  );
};

function argsIsEmpty(args?: Array<unknown>) {
  return !args || args.length === 0;
}

function argsIsNotEmpty(args?: Array<unknown>): args is Array<unknown> {
  return !argsIsEmpty(args);
}
