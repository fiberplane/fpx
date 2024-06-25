import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useRequestDetails } from "@/hooks";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Status } from "@/components/ui/status";
import { useKeySequence } from "@/hooks";
import {
  MizuFetchEnd,
  MizuFetchStart,
  MizuLog,
  MizuRequestEnd,
  MizuRequestStart,
  MizuTrace,
  isMizuFetchEndMessage,
  isMizuFetchStartMessage,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
  useMizuTraces,
} from "@/queries";
import { useEffect, useState } from "react";
import { KeyValueTable } from "./KeyValueTable";
import { DefaultLogCard } from "./RequestDetails";
import { TextOrJsonViewer } from "./TextJsonViewer";

export function RequestDetailsPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const { trace } = useRequestDetails(traceId);
  const navigate = useNavigate();

  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleFocus = (event: FocusEvent) => {
    if (event.target instanceof HTMLInputElement) {
      setIsInputFocused(true);
    }
  };
  const handleBlur = (event: FocusEvent) => {
    if (event.target instanceof HTMLInputElement) {
      setIsInputFocused(false);
    }
  };

  const { data: traces } = useMizuTraces();
  const currIdx = traces?.findIndex((t) => t.id === traceId);

  const handleNextTrace = () => {
    if (!traces || currIdx === undefined) return;

    if (currIdx === traces?.length - 1) {
      return;
    }

    navigate(`/requests/${traces[currIdx + 1].id}`);
  };

  const handlePrevTrace = () => {
    if (!traces || currIdx === undefined) return;
    if (currIdx === 0) {
      return;
    }
    navigate(`/requests/${traces[currIdx - 1].id}`);
  };

  useEffect(() => {
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("blur", handleBlur, true);
    return () => {
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  useKeySequence(["Escape"], () => {
    // catch all the cases where the user is in the input field
    // and we don't want to exit the page
    if (isInputFocused) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement) {
        activeElement.blur();
      }
      return;
    }

    navigate("/requests");
  });

  return (
    <>
      <div className="flex gap-4 items-center">
        <h2 className="text-2xl font-semibold">Request Detail</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            disabled={currIdx === 0}
            onClick={handlePrevTrace}
          >
            <ChevronUpIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            disabled={!traces || currIdx === traces?.length - 1}
            onClick={handleNextTrace}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-5">
        <div className="col-span-1">TOC</div>
        <div className="flex flex-col col-span-4 gap-4 justify-center mx-16 py-4">
          <h3 className="text-xl font-semibold">Summary</h3>
          <Card className="bg-muted/20">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex gap-2 items-center">
                {trace && <Status statusCode={Number(trace?.status)} />}
                <span className="text-primary text-sm">{trace?.method}</span>
                <p className="text-sm">{trace?.path}</p>
              </div>
              <h4 className="uppercase text-xs text-muted-foreground">
                ERROR MESSAGE
              </h4>
              <Card className="rounded bg-secondary text-sm font-mono">
                <CardContent className="p-2">
                  All of your errors are belong to us
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          <Separator />

          <div>{trace ? <TraceDetails trace={trace} /> : null}</div>
        </div>
      </div>
    </>
  );
}

function TraceDetails({ trace }: { trace: MizuTrace }) {
  return (
    <div className="flex flex-col gap-8">
      {trace?.logs &&
        trace?.logs.map((log) => <LogDetails key={log.id} log={log} />)}
    </div>
  );
}

function LogDetails({ log }: { log: MizuLog }) {
  const { message } = log;

  if (isMizuRequestStartMessage(message)) {
    return <RequestLog message={message} />;
  }

  if (isMizuFetchStartMessage(message)) {
    return <FetchRequestLog message={message} />;
  }
  if (isMizuRequestEndMessage(message)) {
    return <ResponseLog message={message} />;
  }
  if (isMizuFetchEndMessage(message)) {
    return <FetchResponseLog message={message} />;
  }

  return <DefaultLogCard log={log} />;
}

function RequestLog({ message }: { message: MizuRequestStart }) {
  const { method, path, headers, query, params } = message;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <h3 className="text-xl font-semibold">Incoming Request</h3>
        <span className="text-primary text-sm">{method}</span>
        <p className="text-sm">{path}</p>
      </div>
      <KeyValueTable keyValue={headers} caption="Headers" />
      {query && <KeyValueTable keyValue={query} caption="Query" />}
      {params && <KeyValueTable keyValue={params} caption="Parameters" />}
    </section>
  );
}

function ResponseLog({ message }: { message: MizuRequestEnd }) {
  const { status, headers, body } = message;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold">Outgoing Response</h3>
        <Status statusCode={Number(status)} />
      </div>
      <KeyValueTable keyValue={headers} caption="Headers" />
      <Card className="bg-muted/20 rounded-xl">
        <CardTitle className="text-sm p-2 font-normal bg-muted/50 rounded-t-xl">
          Body
        </CardTitle>
        <CardContent className="p-2">
          <TextOrJsonViewer text={body} />
        </CardContent>
      </Card>
    </section>
  );
}

function FetchRequestLog({ message }: { message: MizuFetchStart }) {
  const { headers, body, method, url } = message;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <h3 className="text-xl font-semibold">
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Request
        </h3>
        <span className="text-primary text-sm">{method}</span>
        <p className="text-sm">{url}</p>
      </div>

      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}

function FetchResponseLog({ message }: { message: MizuFetchEnd }) {
  const { status, headers, body } = message;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold">
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Response
        </h3>
        <Status statusCode={Number(status)} />
      </div>
      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}

function BodyViewer({ body }: { body: string }) {
  return (
    <Card className="bg-muted/20 rounded-xl">
      <CardTitle className="text-sm p-2 font-normal bg-muted/50 rounded-t-xl">
        Body
      </CardTitle>
      <CardContent className="p-2">
        <TextOrJsonViewer text={body} />
      </CardContent>
    </Card>
  );
}
