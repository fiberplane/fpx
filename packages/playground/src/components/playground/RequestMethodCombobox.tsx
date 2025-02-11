import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils";
import { getHttpMethodTextColor } from "@/utils";
import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { forwardRef } from "react";
import type { RequestMethod } from "./types";

type InputOption = {
  value: RequestMethod;
  label: string;
};

const methods: InputOption[] = [
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
  {
    value: "TRACE",
    label: "TRACE",
  },
];

export const RequestMethodCombobox = forwardRef<
  HTMLButtonElement,
  {
    method: RequestMethod;
    handleMethodChange: (method: RequestMethod) => void;
    allowUserToChange?: boolean;
    className?: string;
  }
>(({ method, handleMethodChange, allowUserToChange, className }, ref) => {
  const [open, setOpen] = React.useState(false);

  const matchedMethod = method
    ? methods.find((m) => m.value === method)?.label
    : "GET";

  return (
    <Popover open={allowUserToChange ? open : false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          aria-expanded={open}
          className={cn(
            "text-left",
            {
              "pointer-events-none": !allowUserToChange,
            },
            "hover:bg-secondary",
            className,
          )}
          onClick={(e) => {
            if (!allowUserToChange) {
              e.stopPropagation();
            }
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
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {methods.map((inputMethod) => (
                <CommandItem
                  key={inputMethod.value}
                  value={inputMethod.value}
                  onSelect={(currentValue: string) => {
                    handleMethodChange(currentValue as RequestMethod);
                    setOpen(false);
                  }}
                  className="data-[selected=true]:bg-secondary"
                >
                  <span
                    className={cn(
                      "text-whitefont-mono",
                      getHttpMethodTextColor(inputMethod.label ?? ""),
                    )}
                  >
                    {inputMethod.label}
                  </span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      method === inputMethod.value
                        ? "opacity-100"
                        : "opacity-0",
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
});

RequestMethodCombobox.displayName = "RequestMethodCombobox";
