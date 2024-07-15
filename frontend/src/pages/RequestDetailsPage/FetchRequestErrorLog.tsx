import { isMizuErrorMessage } from "@/queries";
import { MizuFetchLoggingError } from "@/queries/types";
import { StackTrace } from "./StackTrace";
import { fpxLogId } from "./minimapIdUtils"; // Import the utility function
import { SectionHeading } from "./shared";

export function FetchRequestErrorLog({
  message,
  logId,
}: { message: MizuFetchLoggingError; logId: string }) {
  const id = fpxLogId({ message, id: logId, level: "" }); // Use the utility function to generate the ID
  const { url, error } = message;

  const stack = isMizuErrorMessage(error) && error.stack;
  const description = isMizuErrorMessage(error)
    ? error.message
    : (error as string);

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <SectionHeading>
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Request Failed
        </SectionHeading>
        <p className="text-sm">{url}</p>
      </div>
      {description && <p>{description}</p>}
      {stack && (
        <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-400">
          <StackTrace stackTrace={stack} />
        </div>
      )}
    </section>
  );
}
