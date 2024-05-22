import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

export const LogSheet = ({ log, trace }: { log: MizuLog, trace: MizuTrace }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="px-2 py-0" variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[540px] sm:w-[540px] md:max-w-[680px] md:w-[680px] lg:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Details</SheetTitle>
          <SheetDescription>
            Inspect the log here
          </SheetDescription>
        </SheetHeader>
        <LogDetails log={log} />
        <Separator className="my-4" />
        <TraceDetails trace={trace} />
        <SheetFooter>
          <SheetClose asChild className="mt-4">
            <Button type="submit">Save changes...</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
};

export const TraceDetails = ({ trace }: { trace: MizuTrace }) => {
  return (
    <>
      {trace.map(log => (
        <LogDetails log={log} key={log.id} />
      ))}
    </>
  )
}

export const LogDetails = ({ log }: { log: MizuLog  }) => {
  const { message } = log;
  return (
    <>
      {message && typeof message === "object" && Object.entries(message).map(([key, value]) => {
        return (
          <div key={key} className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
            {key}: {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
          </div>
        )
      })}
    </>
  )
};