import {
  type MizuLog,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchLoggingErrorMessage,
  isMizuFetchStartMessage,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
} from "@/queries";
import { objectHasName } from "@/utils";

type FpxLogIdArg = Pick<MizuLog, "level" | "message"> & {
  id: string | number;
};

export function minimapId(log: FpxLogIdArg) {
  const { message } = log;

  if (isMizuRequestStartMessage(message)) {
    return `request-${message.method}-${message.path}-${log.id}`;
  }
  if (isMizuRequestEndMessage(message)) {
    return `response-${message.status}-${message.path}-${log.id}`;
  }
  if (isMizuFetchStartMessage(message)) {
    return `fetch-request-${message.method}-${message.url}-${log.id}`;
  }
  if (isMizuFetchEndMessage(message)) {
    return `fetch-response-${message.status}-${message.url}-${log.id}`;
  }
  if (isMizuFetchErrorMessage(message)) {
    return `fetch-response-error-${message.status}-${message.url}-${log.id}`;
  }
  if (isMizuFetchLoggingErrorMessage(message)) {
    return `fetch-request-error-${message.url}-${log.id}`;
  }

  const name = objectHasName(message) ? message.name : null;

  const levelWithDefensiveFallback = log.level || "info";

  const id = `log-${levelWithDefensiveFallback}-${name}-${log.id}`;

  return id;
}
