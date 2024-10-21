import { useFetchSettings } from "@/queries";
import type { Settings } from "@fiberplane/fpx-types";

export function useAiEnabled() {
  const { data } = useFetchSettings();
  return data ? hasValidAiConfig(data) : false;
}

function hasValidAiConfig(settings: Settings) {
  const provider = settings.aiProvider;
  switch (provider) {
    // HACK - Special logic for OpenAI to support someone who has set a baseUrl
    //        to use an openai compatible api
    case "openai": {
      const openai = settings.aiProviderConfigurations?.openai;
      const apiKey = openai?.apiKey;
      const model = openai?.model;
      const baseUrl = openai?.baseUrl;
      return (!!apiKey && !!model) || (!!baseUrl && !!model);
    }
    case "anthropic": {
      const anthropic = settings.aiProviderConfigurations?.anthropic;
      const apiKey = anthropic?.apiKey;
      const model = anthropic?.model;
      return !!apiKey && !!model;
    }
    case "mistral": {
      const mistral = settings.aiProviderConfigurations?.mistral;
      const apiKey = mistral?.apiKey;
      const model = mistral?.model;
      return !!apiKey && !!model;
    }
    default:
      return false;
  }
}
