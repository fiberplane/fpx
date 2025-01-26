import { Badge } from "@/components/ui/badge";
import { CF_BINDING_ERROR, CF_BINDING_RESULT } from "@/constants";
import { getString } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { CollapsibleSubSection } from "../../../shared";
import { TextOrJsonViewer } from "@/components/ResponseBody";
import { CfBindingOverview, CfResultAndError } from "./shared";

/**
 * The AI binding, as of writing, only has a `run` method.
 * This component helps surface the model name and inputs.
 * It links to the Cloudflare docs for the given model, which might be risky!
 */
export function CloudflareAISpan({
  attributes,
  metadata,
}: {
  attributes: OtelSpan["attributes"];
  metadata: React.ReactNode;
}) {
  const args = getString(attributes.args);
  const runAiArgs = useCloudflareAiArgs(args);
  const result = getString(attributes[CF_BINDING_RESULT]);
  const error = getString(attributes[CF_BINDING_ERROR]);

  return (
    <div className="text-xs py-2">
      <CfBindingOverview attributes={attributes}>
        <Badge className="text-xs" variant="secondary">
          {runAiArgs.model ? (
            <AiModelLink model={runAiArgs.model} />
          ) : (
            "UNKNOWN MODEL"
          )}
        </Badge>
      </CfBindingOverview>
      <div className="text-xs py-2 space-y-2">
        {runAiArgs.inputs && (
          <CollapsibleSubSection heading="Inputs">
            <CloudflareAiArgs args={runAiArgs.inputs} />
          </CollapsibleSubSection>
        )}
        {runAiArgs.options && (
          <CollapsibleSubSection heading="Options" defaultCollapsed>
            <CloudflareAiArgs args={runAiArgs.options} />
          </CollapsibleSubSection>
        )}
        <CfResultAndError result={result} error={error} />
        <CollapsibleSubSection heading="Span Metadata" defaultCollapsed={true}>
          {metadata}
        </CollapsibleSubSection>
      </div>
    </div>
  );
}

function AiModelLink({ model }: { model: string }) {
  const modelName = model.split("/").pop();
  return (
    <a
      className="text-blue-500 hover:underline"
      href={`https://developers.cloudflare.com/workers-ai/models/${modelName}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {model}
    </a>
  );
}

function CloudflareAiArgs({ args }: { args: string }) {
  return <TextOrJsonViewer text={args} collapsed={true} />;
}

function useCloudflareAiArgs(args: string) {
  return useMemo(() => {
    try {
      const parsedArgs = JSON.parse(args);
      const result: Record<string, string | undefined> = {
        model: parsedArgs[0],
        inputs: parsedArgs[1] ? JSON.stringify(parsedArgs[1]) : undefined,
        options: parsedArgs[2] ? JSON.stringify(parsedArgs[2]) : undefined,
      };
      return result;
    } catch (e) {
      return {};
    }
  }, [args]);
}
