import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks";
import { cn, parsePathFromRequestUrl, truncatePathWithEllipsis } from "@/utils";
import { CopyIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Method, StatusCode } from "../RequestorHistory";
import { Requestornator } from "../queries";
import { usePrompt } from "./ai-test-generation";

export function AiTestGeneration({
  history,
}: {
  history: Array<Requestornator>;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const lastRequest = history[0];

  const [userInput, setUserInput] = useState("");

  const prompt = usePrompt(lastRequest, userInput);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Create Test</Button>
      </DrawerTrigger>
      <DrawerContent className="py-4">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="mt-2 p-2">
            <DrawerTitle>Close the Loop</DrawerTitle>
            <DrawerDescription>
              Describe the problem you encountered or a test you wish to write.
              FPX will create a context-rich prompt that you can copy-paste into
              your favorite Copilot or LLM.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-2 pb-0">
            <div className="flex items-center">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full"
                placeholder={
                  'Example: "I expected to get a 404, but the api returned a 500"'
                }
              />
            </div>
            <div className="mt-2">
              <div className="text-xs uppercase font-bold text-gray-400">
                Additional context
              </div>
              <ContextEntry response={lastRequest} />
            </div>
          </div>
          <DrawerFooter className="mt-4 flex flex-row justify-end px-2">
            <DrawerClose asChild>
              <Button variant="outline" className="">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className="text-white"
              onClick={() => copyToClipboard(prompt)}
            >
              <CopyIcon className="h-4 w-4 mr-2" />{" "}
              {isCopied ? "Copied!" : "Copy Prompt"}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function ContextEntry({ response }: { response: Requestornator }) {
  const isFailure = response?.app_responses?.isFailure;
  const requestMethod = response.app_requests?.requestMethod;
  const responseStatusCode = response.app_responses?.responseStatusCode;

  const fallbackUrl = truncatePathWithEllipsis(
    parsePathFromRequestUrl(
      response.app_requests?.requestUrl,
      response.app_requests?.requestQueryParams ?? undefined,
    ),
  );
  return (
    <div className="mt-2 border rounded py-2 px-3 shadow-sm text-sm">
      <div className="flex flex-col space-y-2 justify-center space-x-2 font-mono">
        <div className="flex space-x-2 items-center">
          <StatusCode status={responseStatusCode} isFailure={isFailure} />
          <Method method={requestMethod} />
          <div
            className={cn(
              "whitespace-nowrap",
              "overflow-ellipsis",
              "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
            )}
          >
            {isFailure
              ? fallbackUrl || "Request failed to send"
              : fallbackUrl || "De tails missing"}
          </div>
        </div>
      </div>
    </div>
  );
}
