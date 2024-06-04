import { CaretDownIcon, CaretRightIcon, CaretSortIcon, CodeIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { getVSCodeLinkFromCallerLocation, getVSCodeLinkFromError } from "@/queries";
import { CallerLocation, KeyValueSchema, MizuErrorMessage, MizuLog, MizuMessage, MizuRequestEnd, MizuRequestStart, MizuTrace, isKnownMizuMessage, isMizuErrorMessage, isMizuRequestEndMessage, isMizuRequestStartMessage } from "@/queries";

function useHandlerSourceCode(source?: string, handler?: string) {
  const [handlerSourceCode, setHandlerSourceCode] = useState<string | null>(null);
  useEffect(() => {
    if (!source) {
      return;
    }
    if (!handler) {
      return;
    }
    const query = new URLSearchParams({
      source,
      handler,
    });
    const fetchSourceLocation = async () => {
      try {
        const pos = await fetch(`/v0/source-function?${query.toString()}`, { method: "POST" }).then(r => {
          if (!r.ok) {
            throw new Error(`Failed to fetch source location from source map: ${r.status}`);
          }
          return r.json().then(r => setHandlerSourceCode(r.functionText))
        });
        return pos;
      } catch (err) {
        console.debug("Could not fetch source location from source map", err);
        return null;
      }
    }

    fetchSourceLocation();
  }, [handler, source])

  return handlerSourceCode;
}

function useAiAnalysis(handlerSourceCode: string, errorMessage: string) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const query = useCallback(() => {
    if (!handlerSourceCode) {
      return;
    }
    if (!errorMessage) {
      return;
    }
    const body = JSON.stringify({
      handlerSourceCode,
      errorMessage,
    });
    const fetchAiAnalysis = async () => {
      setLoading(true);
      try {
        const r = await fetch("/v0/analyze-error", { method: "POST", body }).then(r => {
          if (!r.ok) {
            throw new Error(`Failed to fetch source location from source map: ${r.status}`);
          }
          return r.json()
        });
        setResponse(r?.suggestion);
        setLoading(false);
      } catch (err) {
        console.debug("Could not fetch source location from source map", err);
        setLoading(false);
        return null;
      }
    }

    fetchAiAnalysis();
  }, [handlerSourceCode, errorMessage]);

  return { response, loading, query };
}

export const TraceDetails = ({ trace }: { trace: MizuTrace; }) => {
  const request = trace.logs.find(log => isMizuRequestStartMessage(log.message));
  const response = trace.logs.find(log => isMizuRequestEndMessage(log.message));
  const source = (request?.message as MizuRequestStart)?.file
  const handler = (response?.message as MizuRequestEnd)?.handler;
  const handlerSourceCode = useHandlerSourceCode(source, handler) ?? "";

  return (
    <>
      {trace.logs.map(log => (
        <LogDetails log={log} key={log.id} handlerSourceCode={handlerSourceCode} />
      ))}
    </>
  )
}

const LogCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rounded-md border mt-2 px-4 pt-2 pb-3 font-mono text-sm shadow-sm">
      {children}
    </div>
  )
}

const RequestLog = ({ log }: { log: MizuLog }) => {
  const description = isMizuRequestStartMessage(log.message) ? `${log.message.method} ${log.message.path}` : '';

  return (
    <LogCard>
      <LogDetailsHeader timestamp={log.timestamp} traceId={log.traceId} eventName="Incoming Request" description={description} />
      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}

const FetchRequestLog = ({ log }: { log: MizuLog }) => {
  const description = `Fetch Request: ${"todo"}`
  console.log("FETCH REQUEST", log.args)

  return (
    <LogCard>
      <LogDetailsHeader timestamp={log.timestamp} traceId={log.traceId} eventName="Fetch Start" description={description} />

      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}

const FetchResponseLog = ({ log }: { log: MizuLog }) => {
  const description = `Fetch Response: ${"todo"}`
  console.log("FETCH REQUEST", log.args)

  return (
    <LogCard>
      <LogDetailsHeader timestamp={log.timestamp} traceId={log.traceId} eventName="Fetch Response" description={description} />

      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}

const FetchErrorLog = ({ log }: { log: MizuLog }) => {
  const description = `Fetch Response: ${"todo"}`
  console.log("FETCH REQUEST", log.args)

  return (
    <LogCard>
      <LogDetailsHeader timestamp={log.timestamp} traceId={log.traceId} eventName="Fetch Error" description={description} />

      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}


/**
 * As of writing, only handles 404 for favicon
 */
function getResponseMagicSuggestion({ log }: { log: MizuLog, trace?: MizuTrace }) {
  if (isMizuRequestEndMessage(log.message) && log.message.method === "GET" && log.message.path === "/favicon.ico" && log.message.status === "404") {
    return (
      <div className="flex flex-col">
        If you want to silence this error locally, add the following to your app:
        <code className="text-mono text-gray-700 whitespace-break-spaces mt-2">
          {`// TODO - Add favicon
app.get('/favicon.ico', (c) => c.text('No favicon') ) 
`}
        </code>
      </div>
    )
  }
  return null;
}


const ResponseLog = ({ log }: { log: MizuLog }) => {
  const { status = "", method = "", path = "" } = isMizuRequestEndMessage(log.message) ? log.message : {};
  const description = `${status} ${method} ${path}`
  const magicSuggestion = getResponseMagicSuggestion({ log });
  return (
    <LogCard>
      <LogDetailsHeader eventName="Outgoing Response" timestamp={log.timestamp} traceId={log.traceId} description={description} />
      {magicSuggestion && (
        <MagicSuggestion suggestion={magicSuggestion} />
      )}
      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}
function useCallerLocation(callerLocation: CallerLocation | null) {
  const [vsCodeLink, setVSCodeLink] = useState<string | null>(null);
  useEffect(() => {
    if (callerLocation) {
      getVSCodeLinkFromCallerLocation(callerLocation).then((link) => {
        setVSCodeLink(link)
      })
    }
  }, [callerLocation])

  return vsCodeLink;
}

function getMagicSuggestion({ messagePayload }: { messagePayload: MizuMessage, trace?: MizuTrace }) {
  if (!isKnownMizuMessage(messagePayload)) {
    return null;
  }

  if (messagePayload.message === "process is not defined") {
    return "Change process.env to c.env"
  }

  if (messagePayload.message === "No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?") {
    return "Add a database connection string to `.dev.vars`. If you already did this, make sure to restart your dev server!"
  }

  return null;
}

const ErrorLog = ({ message: messagePayload, callerLocation, handlerSourceCode, traceId, timestamp }: { message: MizuErrorMessage, handlerSourceCode?: string | null } & Pick<MizuLog, "traceId" | "timestamp" | "callerLocation">) => {
  const description = `${messagePayload.message}`;
  const magicSuggestion = getMagicSuggestion({ messagePayload });

  const stack = messagePayload.stack;
  const [vsCodeLink, setVSCodeLink] = useState<string | null>(null);

  const shouldFindCallerLocation = !stack;
  const vsCodeLinkAlt = useCallerLocation(shouldFindCallerLocation ? callerLocation ?? null : null);

  const { response: aiResponse, query: execAiQuery } = useAiAnalysis(handlerSourceCode ?? "", messagePayload.message);

  useEffect(() => {
    if (stack) {
      getVSCodeLinkFromError({ stack }).then((link) => {
        setVSCodeLink(link)
      })
    }
  }, [stack])

  const [isOpen, setIsOpen] = useState(false);

  const vscodeLink = vsCodeLink || vsCodeLinkAlt;
  return (
    <LogCard>
      <LogDetailsHeader eventName="Error" timestamp={timestamp} traceId={traceId} description={description} />

      <div>
        {magicSuggestion && (
          <MagicSuggestion suggestion={magicSuggestion} />
        )}

        {aiResponse && (
          <AiMagicSuggestion suggestion={aiResponse} />
        )}

        {vscodeLink && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" className="w-full">
              <CodeIcon className="mr-2" />
              <a href={vscodeLink}>Go to Code</a>
            </Button>
          </div>
        )}

        {(handlerSourceCode && messagePayload.message) && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" className="w-full" variant="secondary" onClick={execAiQuery}>
              <MagicWandIcon className="mr-2" />
              Do AI stuff
            </Button>
          </div>
        )}

        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="space-y-2 mt-4"
        >
          <div className="flex items-center space-x-1 ">
            <CollapsibleTrigger asChild>
              <Button className="p-0 h-3" variant="link" size="sm">
                {!isOpen ? <CaretRightIcon className="h-4 w-4" /> : <CaretDownIcon className="h-4 w-4" />}
                <span className="sr-only">{isOpen ? "Hide" : "Show"}</span>
              </Button>
            </CollapsibleTrigger>
            <div className="font-bold cursor-pointer" onClick={() => setIsOpen(o => !o)}>
              Stack Trace
            </div>
          </div>
          <CollapsibleContent className="space-y-2">
            <Separator className="my-1" />
            <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-500 hover:text-gray-700 ">
              {messagePayload.stack}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </LogCard>
  )
}

const InfoLog = ({ log }: { log: MizuLog }) => {
  const description = `${log.message}`
  const vsCodeLink = useCallerLocation(log.callerLocation ?? null);
  return (
    <LogCard>
      <LogDetailsHeader eventName="console.log" traceId={log.traceId} timestamp={log.timestamp} description={""} />
      <div className="mt-2 font-sans">
        {description}
      </div>
      <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-500 hover:text-gray-700 ">
        {JSON.stringify(log.args, null, 2)}
      </div>

      {vsCodeLink && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" className="w-full">
            <CodeIcon className="mr-2" />
            <a href={vsCodeLink}>Go to Code</a>
          </Button>
        </div>
      )}
    </LogCard>
  )
}

const MagicSuggestion = ({ suggestion, children }: { suggestion: ReactNode | string; children?: ReactNode }) => {
  return (
    <div className="font-sans rounded-lg border border-purple-400 bg-purple-50 mt-4 px-2 py-3 text-sm shadow-md">
      <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2">
        <div className="text-purple-800 flex items-center">
          <MagicWandIcon className="h-3.5 w-3.5" /> {/* Adjusted icon size for better visual balance */}
        </div>
        <div className="text-left flex items-center">
          <div className="text-purple-800">
            <span className="font-semibold mr-2">Suggestion</span>
          </div>
        </div>
        <div />
        <div className="text-purple-800">
          {suggestion}
        </div>
      </div>
      {children}
    </div>
  );
}


const AiMagicSuggestion = ({ suggestion, children }: { suggestion: string; children?: ReactNode }) => {
  return (
    <div className="font-sans rounded-lg border border-purple-400 bg-purple-50 mt-4 px-2 py-3 text-sm shadow-md overflow-auto">
      <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2">
        <div className="text-purple-800 flex items-center">
          <MagicWandIcon className="h-3.5 w-3.5" /> {/* Adjusted icon size for better visual balance */}
        </div>
        <div className="text-left flex items-center">
          <div className="text-purple-800">
            <span className="font-semibold mr-2">AI Suggestion</span>
          </div>
        </div>
        <div />
        <div className="text-gray-700">
          <ReactMarkdown>{suggestion}</ReactMarkdown>
        </div>
      </div>
      {children}
    </div>
  );
}


const LogDetailsHeader = ({ eventName, description, traceId, timestamp }: { eventName: string; description: string; } & Pick<MizuLog, "traceId" | "timestamp">) => {
  return (
    <div>
      <div className="font-mono text-gray-500 w-full flex flex-col sm:flex-row md:space-0 justify-between items-center">
        <div className="font-bold" style={{ marginLeft: "-.625rem" }}> { /* HACK - Do this properly eventually */}
          <Badge className="mr-2" variant="secondary">
            {eventName}
          </Badge>
        </div>
        <span className="text-xs my-1 sm:my-0">[{timestamp}]</span>
        <span className="hidden">
          {traceId}
        </span>
      </div>
      {description && (<div className="mt-1">
        {description}
      </div>)}

    </div>

  )
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KVGridProps = { data: string | Record<string, any> };

const KeyValueGrid: React.FC<KVGridProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false)
  // const { lifecycle, method, path, ...message } = data; // TODO - extract these
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 ">
        {/* <h4 className="text-sm font-semibold">
          Context
        </h4> */}
        <CollapsibleTrigger asChild>
          <Button className="group p-0 h-4 text-cyan-700" variant="link" size="sm">
            Show {isOpen ? "Less" : "More"}
            <CaretSortIcon className="h-4 w-4" />
            <span className="sr-only">Show {isOpen ? "Less" : "More"}</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <Separator className="my-1" />
        <div className="flex flex-col gap-4">
          {typeof data === "string" ? data :
            Object.entries(data).map(([key, value]) => {
              const keyValue = (key === "env" || key === "headers") && KeyValueSchema.safeParse(value).data;
              return (
                <div key={key}>
                  <div className="font-mono font-semibold text-gray-600">
                    {key}
                  </div>
                  <div className="font-sans text-gray-800 max-h-[200px] overflow-y-auto mt-1">
                    {keyValue ? <EnvGrid env={keyValue} /> : formatValue(value)}
                  </div>
                  <Separator className="my-1" />
                </div>
              )
            })}
        </div>
      </CollapsibleContent>

    </Collapsible>
  );
};

const EnvGrid = ({ env }: { env: Record<string, string> }) => {
  return (
    <div className="flex flex-col">
      {Object.entries(env).map(([key, value]) => {
        return (
          <div className="mt-2 font-mono" key={key}>
            <div className="col-span-1 font-semibold text-xs">
              {key}
            </div>
            <div className="col-span-1 text-mono">
              {value}
            </div>
          </div>

        )
      })}
    </div>
  )
}

export const LogDetails = ({ log, handlerSourceCode }: { log: MizuLog; handlerSourceCode: string; }) => {
  const { message } = log;
  const lifecycle = typeof message === "object" && "lifecycle" in message ? message.lifecycle : null;

  if (lifecycle === "request") {
    return <RequestLog log={log} />
  }

  if (lifecycle === "fetch_start") {
    return <FetchRequestLog log={log} />
  }

  if (lifecycle === "fetch_end") {
    return <FetchResponseLog log={log} />
  }

  if (lifecycle === "fetch_error") {
    return <FetchErrorLog log={log} />
  }

  if (lifecycle === "response") {
    return <ResponseLog log={log} />
  }

  if (isMizuErrorMessage(message)) {
    return (
      <ErrorLog
        handlerSourceCode={handlerSourceCode}
        message={message}
        timestamp={log.timestamp}
        traceId={log.traceId}
        callerLocation={log.callerLocation ?? null}
      />
    );
  }

  if (typeof message === "string") {
    return <InfoLog log={log} />
  }

  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      {message && typeof message === "object" && Object.entries(message).map(([key, value]) => {
        return (
          <div key={key} className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
            {key}: {formatValue(value)}
          </div>
        )
      })}
    </div>
  )
};

function formatValue(value: unknown): ReactNode {
  // handle undefined
  if (value === undefined) {
    return <em>Undefined</em>
  }

  if (value === null) {
    return <em>null</em>
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }


  return value.toString();
}
