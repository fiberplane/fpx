import { useState } from "react"

import { MockLog } from "@/queries/mock-data"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CaretSortIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"


export const MessageJson = ({ message }: { message: MockLog["message"] }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="flex items-center justify-between space-x-4">
        <h4 className="text-sm font-semibold">
          JSON Message
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <CaretSortIcon className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
        @radix-ui/primitives
      </div> */}
      <CollapsibleContent className="space-y-2">
        {message && typeof message === "object" && Object.entries(message).map(([key, value]) => {
          return (
            <div key={key} className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
              {key}: {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
            </div>
          )
        })}
        {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          {JSON.stringify(message, null, 2)}
        </div> */}
        {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @stitches/react
        </div> */}
      </CollapsibleContent>
    </Collapsible>
  )
}
