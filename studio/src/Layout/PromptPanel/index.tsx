import { CodeMirrorPrompt } from "@/components/CodeMirrorEditor";
import { Button } from "@/components/ui/button";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import type { Completion } from "@codemirror/autocomplete";
import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const translateCommands = async (commands: string) => {
  const response = await fetch("/v0/translate-commands", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: commands,
  });

  if (!response.ok) {
    throw new Error("Failed to translate commands");
  }

  return response.json();
};

export function PromptToggle() {
  const { togglePanel } = useRequestorStore("togglePanel");

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => togglePanel("promptPanel")}
        className="gap-2 text-muted-foreground px-2 py-0"
      >
        <Icon icon="lucide:workflow" className="h-4 w-4 p-0" />
        Workflows
      </Button>
    </div>
  );
}

export function PromptPanel() {
  const [promptValue, setPromptValue] = useState("");
  const [translatedCommands, setTranslatedCommands] = useState<string | null>(
    null,
  );

  const { promptPanel, togglePanel, routes } = useRequestorStore(
    "promptPanel",
    "togglePanel",
    "routes",
  );

  const translateCommandsMutation = useMutation({
    mutationFn: translateCommands,
  });

  const routeCompletions: Completion[] = routes.map((route) => ({
    label: `[route:${route.id}]`,
    displayLabel: `${route.method} ${route.path}`,
  }));

  useHotkeys("mod+i", () => togglePanel("promptPanel"));
  const handlePromptChange = (value?: string) => {
    if (value !== undefined) {
      setPromptValue(value);
    }
  };

  const handlePromptSubmit = async () => {
    const replacedPrompt = promptValue.replace(
      /@\[route:(\d+)\]/g,
      (match, routeId) => {
        const route = routes.find((r) => r.id === Number.parseInt(routeId, 10));
        if (route) {
          return `[Route Details:
Path: ${route.path}
Method: ${route.method}
Handler: ${route.handler}
OpenAPI Spec: ${JSON.stringify(route.openApiSpec, null, 2)}]`;
        }
        return match;
      },
    );

    try {
      const result =
        await translateCommandsMutation.mutateAsync(replacedPrompt);
      setTranslatedCommands(JSON.stringify(result.commands, null, 2));
    } catch (error) {
      console.error("Failed to translate commands:", error);
    }
  };

  if (promptPanel === "closed") {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center">
      <div className="w-full max-w-lg min-h-24 bg-background border rounded-lg shadow-lg">
        <div className="p-4">
          <CodeMirrorPrompt
            onBlur={() => {}}
            onChange={handlePromptChange}
            onSubmit={handlePromptSubmit}
            value={promptValue}
            placeholder="Enter a prompt. Use @ to reference a route."
            routes={routes}
            completions={[
              {
                data: routeCompletions,
                character: "@",
              },
            ]}
          />
          <Button
            className="mt-2 w-full"
            onClick={handlePromptSubmit}
            disabled={translateCommandsMutation.isPending}
          >
            {translateCommandsMutation.isPending
              ? "Translating..."
              : "Translate Commands"}
          </Button>
        </div>
        {translatedCommands && (
          <div className="p-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Translated Commands:</h3>
            <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {translatedCommands}
            </pre>
            <Button
              className="mt-2"
              onClick={() => setTranslatedCommands(null)}
            >
              Clear Result
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
