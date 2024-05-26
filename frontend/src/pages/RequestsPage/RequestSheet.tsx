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
import type { MizuTrace } from "@/queries/decoders";
import { TraceDetails } from "../RequestDetailsPage/RequestDetails";

export const RequestSheet = ({ trace }: { trace: MizuTrace }) => {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet>
        <SheetTrigger asChild >
          <Button size="sm" className="px-2 py-0" variant="outline">Peek</Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:max-w-[540px] sm:w-[540px] md:max-w-[680px] md:w-[680px] lg:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Request Details</SheetTitle>
            <SheetDescription>
              Inspect logs from the request here
            </SheetDescription>
          </SheetHeader>
          {/* <div className="text-mono">
          <code className="whitespace-break-spaces">
            {f}
          </code>
        </div> */}
          <TraceDetails trace={trace} />
          <SheetFooter>
            <SheetClose asChild className="mt-4">
              <Button type="button" variant="secondary">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
};
