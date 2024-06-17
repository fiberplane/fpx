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

export function RequestMethodCombobox({ method }: { method: string }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(method);
  // HACK - antipattern
  useEffect(() => {
    setValue(method);
  }, [method]);
  const matchedMethod = value
    ? methods.find((m) => m.value === value)?.label
    : "GET";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="text-left"
        >
          <span
            className={cn(
              "font-mono min-w-12",
              getHttpMethodTextColor(matchedMethod ?? ""),
            )}
          >
            {matchedMethod}
          </span>
          <CaretSortIcon className="ml-1 h-4 w-4 shrink-0 opacity-50" />
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
                    setValue(currentValue === value ? "" : currentValue);
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
                      value === framework.value ? "opacity-100" : "opacity-0",
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
