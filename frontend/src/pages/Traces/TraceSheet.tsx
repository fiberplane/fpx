import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MizuTrace, MizuLog } from "@/queries/decoders";
import { getVSCodeLink } from "@/queries/vscodeLinks";
import { CodeIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

export const TraceSheet = ({ trace }: { trace: MizuTrace }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="px-2 py-0" variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[540px] sm:w-[540px] md:max-w-[680px] md:w-[680px] lg:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Details</SheetTitle>
          <SheetDescription>
            Inspect logs from the request here
          </SheetDescription>
        </SheetHeader>
        <TraceDetails trace={trace} />
        <SheetFooter>
          <SheetClose asChild className="mt-4">
            <Button type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
};

export const TraceDetails = ({ trace }: { trace: MizuTrace }) => {
  return (
    <>
      {trace.logs.map(log => (
        <LogDetails log={log} key={log.id} />
      ))}
    </>
  )
}

const RequestLog = ({ log }: { log: MizuLog }) => {
  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <div>
        [{log.timestamp}]
        <span className="invisible">
          {log.traceId}
        </span>
      </div>
      <div>
        Request: {log.message.method} {log.message.path}
      </div>
    </div>
  )
}

const ResponseLog = ({ log }: { log: MizuLog }) => {
  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <div>
        [{log.timestamp}]
        <span className="invisible">
          {log.traceId}
        </span>
      </div>
      <div>
        Response: {log.message.status} {log.message.method} {log.message.path}
      </div>
    </div>
  )
}

const ErrorLog = ({ log }: { log: MizuLog }) => {
  const stack = log.message.stack;
  const [vsCodeLink, setVSCodeLink] = useState<string | null>(null);
  useEffect(() => {
    if (stack) {
      getVSCodeLink({ stack }).then((link) => {
        setVSCodeLink(link)
      })
    }
  }, [stack])


  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <div>
        [{log.timestamp}]
        <span className="invisible">
          {log.traceId}
        </span>
      </div>
      {vsCodeLink && (
        <div className="flex items-center">
          <CodeIcon />
          <a href={vsCodeLink}>Go to Code</a>
        </div>
      )}
      <div>
        Error: {log.message.message}
        <div>
          {log.message.stack}
        </div>
      </div>
    </div>
  )
}

const InfoLog = ({ log }: { log: MizuLog }) => {
  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <div>
        [{log.timestamp}]
        <span className="invisible">
          {log.traceId}
        </span>
      </div>
      <div>
        Info: {log.message}
      </div>
    </div>
  )
}


export const LogDetails = ({ log }: { log: MizuLog }) => {
  const { message } = log;

  if (message?.lifecycle === "request") {
    return <RequestLog log={log} />
  }

  if (message?.lifecycle === "response") {
    return <ResponseLog log={log} />
  }

  if (typeof message === "object" && "message" in message) {
    return <ErrorLog log={log} />
  }

  if (typeof message === "string") {
    return <InfoLog log={log} />
  }

  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      {message && typeof message === "object" && Object.entries(message).map(([key, value]) => {
        return (
          <div key={key} className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
            {key}: {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
          </div>
        )
      })}
    </div>
  )
};