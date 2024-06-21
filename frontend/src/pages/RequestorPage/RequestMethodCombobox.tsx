import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  // CommandEmpty,
  CommandGroup,
  // CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils";
import { useEffect } from "react";
import { getHttpMethodTextColor } from "./method";

const methods = [
  {
    value: "GET",
    label: "GET",
  },
  {
    value: "POST",
    label: "POST",
  },
  {
    value: "PUT",
    label: "PUT",
  },
  {
    value: "PATCH",
    label: "PATCH",
  },
  {
    value: "DELETE",
    label: "DELETE",
  },
  {
    value: "OPTIONS",
    label: "OPTIONS",
  },
  {
    value: "HEAD",
    label: "HEAD",
  },
];

export function RequestMethodCombobox({
  method,
  setMethod,
  // NOTE - For the first version of Requestor, we don't want people messing too much with
  //        The "method" in the input, so we just disable ability to change the method via
  //        the combobox.
  allowUserToChange,
}: {
  method: string;
  setMethod: (method: string) => void;
  allowUserToChange?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const matchedMethod = method
    ? methods.find((m) => m.value === method)?.label
    : "GET";

  return (
    <Popover open={false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn("text-left", {
            "pointer-events-none": !allowUserToChange,
          })}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <span
            className={cn(
              "font-mono min-w-4",
              getHttpMethodTextColor(matchedMethod ?? ""),
            )}
          >
            {matchedMethod}
          </span>
          {/* <CaretSortIcon className="ml-1 h-4 w-4 shrink-0 opacity-50" /> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {methods.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setMethod(currentValue === method ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <span
                    className={cn(
                      "text-whitefont-mono",
                      getHttpMethodTextColor(framework.label ?? ""),
                    )}
                  >
                    {framework.label}
                  </span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      method === framework.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
