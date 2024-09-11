import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks";
import { parsePathFromRequestUrl } from "@/utils";
import {
  CopyIcon,
  Cross1Icon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { Requestornator } from "../queries";
import { findMatchedRoute } from "../routes";
import { useActiveRoute, useServiceBaseUrl } from "../store";
import type { Panels } from "../types";
import { ContextEntry } from "./AiTestGenerationDrawer";
import { usePrompt } from "./ai-test-generation";

export function AiTestGenerationPanel({
  history,
  togglePanel,
}: {
  history: Array<Requestornator>;
  togglePanel: (panelName: keyof Panels) => void;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const activeRoute = useActiveRoute();
  const { removeServiceUrlFromPath } = useServiceBaseUrl();
  const lastMatchingRequest = useMemo<Requestornator | null>(() => {
    const match = history.find((response) => {
      const path = parsePathFromRequestUrl(response.app_requests?.requestUrl);

      if (path === null) {
        return false;
      }

      const match = findMatchedRoute(
        [activeRoute],
        removeServiceUrlFromPath(path),
        activeRoute.method,
        activeRoute.requestType,
      );

      if (match) {
        return true;
      }

      // HACK - For requests against non-detected routes, we can search for the exact request url...
      if (response.app_requests?.requestUrl === activeRoute.path) {
        return true;
      }

      return false;
    });

    return match ?? null;
  }, [activeRoute, history, removeServiceUrlFromPath]);

  const [userInput, setUserInput] = useState("");

  const prompt = usePrompt(lastMatchingRequest, userInput);

  return (
    <div className="overflow-hidden h-full relative border-l">
      <Tabs defaultValue="ai-prompt">
        <CustomTabsList>
          <CustomTabTrigger value="ai-prompt">AI Prompt</CustomTabTrigger>

          <div className="flex-grow flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePanel("aiTestGeneration")}
              className="h-6 w-6"
            >
              <Cross1Icon className="h-3 w-3 cursor-pointer" />
            </Button>
          </div>
        </CustomTabsList>
        <CustomTabsContent value="ai-prompt" className="">
          <div className="w-full">
            <h3 className="">Close the Loop</h3>
            <div className="text-sm text-muted-foreground py-2">
              Describe the problem you encountered or a test you wish to write.
              FPX will create a context-rich prompt that you can copy-paste into
              your favorite Copilot or LLM.
            </div>
            <div className="mt-2">
              <div className="">
                <div className="text-sm text-gray-200">Context</div>
                {lastMatchingRequest ? (
                  <ContextEntry response={lastMatchingRequest} />
                ) : (
                  <div className="text-sm text-muted-foreground py-2 rounded border px-3 mt-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" /> No
                    matching request context found
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-200">Description</div>
                <div className="mt-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full"
                    placeholder={
                      'Example: "I expected to get a 404, but the api returned a 500"'
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-row justify-end px-2">
              <Button onClick={() => copyToClipboard(prompt)}>
                <CopyIcon className="h-4 w-4 mr-2" />{" "}
                {isCopied ? "Copied!" : "Copy Prompt"}
              </Button>
            </div>
          </div>
        </CustomTabsContent>
      </Tabs>
    </div>
  );
}
