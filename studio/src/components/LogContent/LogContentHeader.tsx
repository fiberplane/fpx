import type { MizuOrphanLog } from "@/queries";
import { getIconColor } from ".";

type Props = {
  /**
   * Determines whether the log icon should be shown (and the level will determine the color).
   *
   * No icon is shown if this is false.
   */
  logLevel?: MizuOrphanLog["level"];

  message: string;
  /**
   * Whether to show the timestamp of the log.
   */
  formattedTimestamp?: string;
};

export function LogContentHeader(props: Props) {
  const { logLevel, formattedTimestamp, message } = props;

  return (
    <div className="py-1 flex items-center">
      {logLevel && (
        <div
          className={`w-2 h-2 mr-2 flex-shrink-0 rounded-[15%] ${getIconColor(logLevel)}`}
        />
      )}

      <div className="font-mono text-xs flex-grow truncate">{message}</div>
      {formattedTimestamp && (
        <div className="font-mono text-xs text-right whitespace-nowrap ml-2">
          {formattedTimestamp}
        </div>
      )}
    </div>
  );
}
