import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CopyIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import { Requestornator } from "../queries";
import { ContextEntry } from "./AiTestGenerationDrawer";
import { useCopyToClipboard, usePrompt } from "./ai-test-generation";

export function AiTestGenerationPanel({
  history,
  toggleAiTestGenerationPanel,
}: {
  history: Array<Requestornator>;
  toggleAiTestGenerationPanel: () => void;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const lastRequest = history[0];

  const [userInput, setUserInput] = useState("");

  const prompt = usePrompt(lastRequest, userInput);

  return (
    <div className="overflow-hidden h-full relative border-l">
      <Tabs defaultValue="ai-prompt">
        <CustomTabsList>
          <CustomTabTrigger value="ai-prompt">AI Prompt</CustomTabTrigger>

          <div className="flex-grow flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAiTestGenerationPanel}
            >
              <Cross1Icon className="h-4 w-4 cursor-pointer" />
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
                <ContextEntry response={lastRequest} />
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
              <Button
                className="text-white"
                onClick={() => copyToClipboard(prompt)}
              >
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
