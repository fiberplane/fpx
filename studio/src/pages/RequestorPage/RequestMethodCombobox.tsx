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
import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { forwardRef } from "react";
import { getHttpMethodTextColor } from "./method";
import type { RequestMethodInputValue } from "./types";
import { WEBSOCKETS_ENABLED } from "./webSocketFeatureFlag";

type InputOption = {
  value: RequestMethodInputValue;
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
  // NOTE - This "WS" option is a special beast
  //        It will implicitly set the form value to "GET",
  //        but it will also set a "requestType" to "websocket"
  //        in the underlying ui state. (See the `handleMethodChange`
  //        function to see what's going on.)
  {
    value: "WS",
    label: "WS",
  },
];

// HACK - Mutably splice out the "WS" entry if websockets feature is disabled
if (!WEBSOCKETS_ENABLED) {
  const wsIndex = methods.findIndex((method) => method.value === "WS");
  if (wsIndex !== -1) {
    methods.splice(wsIndex, 1);
  }
}

export const RequestMethodCombobox = forwardRef<
  HTMLButtonElement,
  {
    method: RequestMethodInputValue;
    handleMethodChange: (method: RequestMethodInputValue) => void;
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
          role="combobox"
          aria-expanded={open}
          className={cn(
            "text-left",
            {
              "pointer-events-none": !allowUserToChange,
            },
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
                  onSelect={(currentValue) => {
                    // HACK - Type coercion because I don't feel like digging through the docs here to figure out how to type this properly
                    handleMethodChange(currentValue as RequestMethodInputValue);
                    setOpen(false);
                  }}
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
