import type { PlaygroundActiveResponse } from "@/components/playground/store/types";
import { LinkBreak2Icon } from "@radix-ui/react-icons";

export function FailedRequest({
  response,
}: { response?: PlaygroundActiveResponse }) {
  // TODO - Show more granular error messages
  const friendlyMessage = response?.isFailure ? "Service unreachable" : null;
  return (
    <div className="h-full pb-8 sm:pb-20 md:pb-32 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-destructive" />
        <div className="mt-4 text-md text-foreground text-center">
          {friendlyMessage
            ? `Request failed: ${friendlyMessage}`
            : "Request failed"}
        </div>
        <div className="mt-2 text-ms text-muted-foreground text-center font-light">
          Make sure your api is up!
        </div>
      </div>
    </div>
  );
}
