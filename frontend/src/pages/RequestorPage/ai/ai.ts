import { useToast } from "@/components/ui/use-toast";
import { useAiEnabled } from "@/hooks/useAiEnabled";
import { errorHasMessage } from "@/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { KeyValueParameter, createKeyValueParameters } from "../KeyValueForm";
import { ProbedRoute, Requestornator } from "../queries";
import { useAiRequestData } from "./generate-request-data";

export const FRIENDLY = "Friendly" as const;
export const HOSTILE = "QA" as const;

export type AiTestingPersona = "Friendly" | "QA";

type FormSetters = {
  setBody: (body: string) => void;
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (params: KeyValueParameter[]) => void;
  setPath: (path: string) => void;
  setPathParams: React.Dispatch<React.SetStateAction<KeyValueParameter[]>>;
};

export function useAi(
  selectedRoute: ProbedRoute | null,
  requestHistory: Array<Requestornator>,
  formSetters: FormSetters,
) {
  const { toast } = useToast();
  const isAiEnabled = useAiEnabled();

  const { ignoreAiInputsBanner, setIgnoreAiInputsBanner } =
    useIgnoreAiGeneratedInputsBanner();

  const [showAiGeneratedInputsBanner, setShowAiGeneratedInputsBanner] =
    useState(false);

  const { setBody, setQueryParams, setPath, setPathParams, setRequestHeaders } =
    formSetters;

  // Testing persona determines what kind of request data will get generated by the AI
  const [testingPersona, setTestingPersona] =
    useState<AiTestingPersona>(FRIENDLY);

  // We will send the recent history as context
  const recentHistory = useMemo(() => {
    return requestHistory.slice(0, 5);
  }, [requestHistory]);

  const { isFetching: isLoadingParameters, refetch: generateRequestData } =
    useAiRequestData(selectedRoute, recentHistory, testingPersona);

  const fillInRequest = useCallback(() => {
    generateRequestData().then(({ data, isError, error }) => {
      if (isError) {
        toast({
          variant: "destructive",
          title: "Uh oh! Failed to generate request data",
          description: errorHasMessage(error)
            ? error?.message
            : "There was a problem with your request.",
          // action: <ToastAction altText="Try again"> Try again</ ToastAction >,
        });
        return;
      }

      const body = data.request?.body;
      const queryParams = data.request?.queryParams;
      const path = data.request?.path;
      const pathParams = data.request?.pathParams;
      const headers = data.request?.headers;

      if (body) {
        setBody(body);
      }

      // NOTE - We need to be clear on the types here, otherwise this could wreak havoc on our form data
      if (validateKeyValueParamsFromResponse(queryParams)) {
        const newParameters = createKeyValueParameters(queryParams);
        setQueryParams(newParameters);
      } else {
        // TODO - Should we clear the query params if they are not present in the response?
      }
      if (path) {
        setPath(path);
      }

      // TODO - Validate path params
      if (pathParams) {
        setPathParams((current) => {
          return current.map((pathParam) => {
            const replacement = pathParams?.find(
              (p: KeyValueParameter) => p?.key === pathParam.key,
            );
            if (replacement) {
              return {
                ...pathParam,
                value: replacement.value,
              };
            }
            return pathParam;
          });
        });
      } else {
        // TODO - Clear path params if they are not present in the response
      }

      if (validateKeyValueParamsFromResponse(headers)) {
        const newHeaders = createKeyValueParameters(headers);
        setRequestHeaders(newHeaders);
      } else {
        // TODO - Clear headers if they are not present in the response?
      }

      setShowAiGeneratedInputsBanner(true);
    });
  }, [
    generateRequestData,
    setBody,
    setPath,
    setPathParams,
    setQueryParams,
    setRequestHeaders,
    toast,
  ]);

  return {
    showAiGeneratedInputsBanner:
      !ignoreAiInputsBanner && !!showAiGeneratedInputsBanner,
    setShowAiGeneratedInputsBanner,
    ignoreAiInputsBanner,
    setIgnoreAiInputsBanner,
    enabled: isAiEnabled,
    isLoadingParameters,
    fillInRequest,
    testingPersona,
    setTestingPersona,
  };
}

const KeyValueSchema = z.object({
  key: z.string(),
  value: z.string(),
});

type KeyValueObject = z.infer<typeof KeyValueSchema>;

const isKeyValueParamReplacement = (
  queryParam: unknown,
): queryParam is KeyValueObject => {
  return !!KeyValueSchema.safeParse(queryParam).success;
};

function validateKeyValueParamsFromResponse(
  queryParams: unknown,
): queryParams is Array<KeyValueObject> {
  return (
    !!queryParams &&
    Array.isArray(queryParams) &&
    queryParams.every((qp) => {
      return isKeyValueParamReplacement(qp);
    })
  );
}

/**
 * This is a local storage flag to hide the banner that shows up when AI generated inputs are being used.
 * This is used to prevent the banner from showing up after the user hits "Ignore" once.
 *
 * - Default value: false, don't ignore the banner
 * - Value if the localStorage contents are not json parseable: true, ignore the banner
 *
 * TODO - Persist this in the API instead
 */
export function useIgnoreAiGeneratedInputsBanner() {
  const LOCAL_STORAGE_KEY = "ignoreAiGeneratedInputsBanner";

  const [ignoreAiInputsBanner, setIgnoreAiInputsBanner] = useState<boolean>(
    () => {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
      try {
        return storedValue ? JSON.parse(storedValue) : false;
      } catch (e) {
        console.error("Failed to parse stored value:", e);
        return true;
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(ignoreAiInputsBanner),
    );
  }, [ignoreAiInputsBanner]);

  return {
    ignoreAiInputsBanner,
    setIgnoreAiInputsBanner,
  };
}
