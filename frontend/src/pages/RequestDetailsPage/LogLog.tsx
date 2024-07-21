import { MizuMessage } from "@/queries";
import {
  hasStringMessage,
  objectHasName,
  objectHasStack,
  renderFullLogMessage,
} from "@/utils";
import { LogLevel } from "./RequestDetailsPage";
import { StackTrace } from "./StackTrace";
import { minimapId } from "./minimapId";
import { SectionHeading } from "./shared";

export function LogLog({
  message,
  level,
  args,
  logId,
}: {
  message: string | MizuMessage;
  level: LogLevel;
  args?: Array<unknown>;
  logId: string;
}) {
  const description = getDescription(message, args);
  const { type: contentsType, value: contents } = getLogContents(message, args);
  const stack = objectHasStack(message) ? message.stack : null;

  const name = objectHasName(message) ? message.name : null;

  const levelWithDefensiveFallback = level || "info";
  const consoleMethod = levelWithDefensiveFallback === "info" ? "log" : level;

  const heading = `console.${consoleMethod}${name ? `:  ${name}` : ""}`;
  const id = minimapId({ message, id: logId, level: level });
  console.log("loglog id", id);
  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <SectionHeading className="font-mono">{heading}</SectionHeading>
      </div>

      {description && <p>{description}</p>}

      {contentsType === "multi-arg-log" && (
        <LogContents fullLogArgs={contents} />
      )}
      {contentsType === "json" && <LogContents fullLogArgs={contents} />}

      {stack && (
        <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-400">
          <StackTrace stackTrace={stack} />
        </div>
      )}
    </section>
  );
}

function getDescription(message: string | MizuMessage, args?: Array<unknown>) {
  if (!message) {
    return "";
  }
  if (hasStringMessage(message)) {
    return message.message;
  }
  // TODO - Render a smarter message
  if (argsIsNotEmpty(args)) {
    return "";
  }
  if (typeof message === "string") {
    return message;
  }
  if (hasStringMessage(message)) {
    return message.message;
  }
  return "";
}

function getLogContents(message: string | MizuMessage, args?: Array<unknown>) {
  if (!message && argsIsEmpty(args)) {
    return { type: "empty" as const, value: null };
  }

  if (argsIsNotEmpty(args)) {
    return { type: "multi-arg-log" as const, value: [message, ...args] };
  }

  if (typeof message === "string") {
    return { type: "string" as const, value: message };
  }

  if (hasStringMessage(message)) {
    return {
      type: "string" as const,
      value: message.message,
    };
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
