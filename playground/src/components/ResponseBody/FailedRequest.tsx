import type { ProxiedRequestResponse } from "@/components/playground/queries";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "@/components/playground/store/types";
import { LinkBreak2Icon } from "@radix-ui/react-icons";

export function FailedRequest({
  response,
}: { response?: ProxiedRequestResponse | RequestorActiveResponse }) {
  // TODO - Show a more friendly error message
  const failureReason = isRequestorActiveResponse(response)
    ? null
    : response?.app_responses?.failureReason;
  const friendlyMessage =
    failureReason === "fetch failed" ? "Service unreachable" : null;
  // const failureDetails = response?.app_responses?.failureDetails;
  return (
    <div className="h-full pb-8 sm:pb-20 md:pb-32 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-red-200" />
        <div className="mt-4 text-md text-white text-center">
          {friendlyMessage
            ? `Request failed: ${friendlyMessage}`
            : "Request failed"}
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Make sure your api is up and has FPX Middleware enabled!
        </div>
      </div>
    </div>
  );
}
