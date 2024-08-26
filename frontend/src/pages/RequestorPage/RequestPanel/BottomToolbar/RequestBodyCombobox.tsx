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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import type { RequestBodyType, RequestorBody } from "../../reducer";

type RequestBodyTypeOption = {
  value: RequestBodyType;
  label: string;
};

const bodyTypes: RequestBodyTypeOption[] = [
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
  { value: "form-data", label: "Form" },
  { value: "file", label: "File" },
];

export type RequestBodyTypeDropdownProps = {
  requestBody: RequestorBody;
  handleRequestBodyTypeChange: (
    contentType: RequestBodyType,
    isMultipart?: boolean,
  ) => void;
  isDisabled: boolean;
};

export function RequestBodyTypeDropdown({
  requestBody,
  handleRequestBodyTypeChange,
  isDisabled,
}: RequestBodyTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const requestBodyType = requestBody.type;
  const bodyTypeLabel = useMemo(() => {
    return (
      bodyTypes.find((type) => type.value === requestBodyType)?.label ?? "Body"
    );
  }, [requestBodyType]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                role="combobox"
                aria-expanded={open}
                className="pl-3 disabled:pointer-events-auto"
                disabled={isDisabled}
              >
                <CaretSortIcon className="w-4 h-4 mr-1" />
                {bodyTypeLabel}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>

          {isDisabled && (
            <TooltipContent align="start">
              Cannot change body type for GET and HEAD requests
            </TooltipContent>
          )}
        </Tooltip>

        {requestBody.type === "form-data" && (
          <div className="flex items-center gap-1">
            <Switch
              checked={requestBody.isMultipart}
              onCheckedChange={(checked) => {
                handleRequestBodyTypeChange("form-data", checked);
              }}
            />
            <span className="text-xs text-muted-foreground">Multipart</span>
          </div>
        )}
      </div>

      <PopoverContent className="w-[120px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {bodyTypes.map((type) => (
                <CommandItem
                  key={type.value}
                  value={type.value}
                  onSelect={(currentValue) => {
                    handleRequestBodyTypeChange(
                      currentValue as RequestBodyType,
                    );
                    setOpen(false);
                  }}
                >
                  <span>{type.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      requestBodyType === type.value
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
}
