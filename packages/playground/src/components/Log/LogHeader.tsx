import type { MizuOrphanLog } from "@/types";
import { safeParseJson } from "@/utils";
import { formatTimestamp, getIconColor } from "./utils";

type Props = {
  /**
   * Determines whether the log icon should be shown (and the level will determine the color).
   *
   * No icon is shown if this is false.
   */
  logLevel?: MizuOrphanLog["level"];

  message: string | null;
  /**
   * Whether to show the timestamp of the log.
   */
  timestamp?: Date;
};

export function LogHeader(props: Props) {
  const { logLevel, timestamp, message } = props;
  const formattedTimestamp = timestamp && formatTimestamp(timestamp);
  const parsedMessage = message && safeParseJson(message);

  return (
    <div className="py-1 flex items-center">
      {logLevel && (
        <div
          className={`w-2 h-2 mr-2 flex-shrink-0 rounded-[15%] ${getIconColor(logLevel)}`}
        />
      )}

      <div className="font-mono text-xs flex-grow truncate">
        {typeof parsedMessage === "string" ? parsedMessage : (message ?? "")}
      </div>
      {formattedTimestamp && (
        <div className="font-mono text-xs text-right whitespace-nowrap ml-2">
          {formattedTimestamp}
        </div>
      )}
    </div>
  );
}
