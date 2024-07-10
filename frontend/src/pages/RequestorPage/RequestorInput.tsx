import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriangleRightIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type RequestInputProps = {
  method: string;
  handleMethodChange: (method: string) => void;
  path?: string;
  handlePathInputChange: (newPath: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isRequestorRequesting?: boolean;
  addBaseUrl: (path: string) => string;
  formRef: React.RefObject<HTMLFormElement>;
};

export function RequestorInput({
  method,
  handleMethodChange,
  path,
  handlePathInputChange,
  onSubmit,
  isRequestorRequesting,
  addBaseUrl,
  formRef
}: RequestInputProps) {
  const [value, setValue] = useState("");

  // HACK - If path changes externally, update the value here
  // This happens if the user clicks a route in the sidebar, for example,
  // or when they load a request from history
  useEffect(() => {
    const url = addBaseUrl(path ?? "");
    setValue(url);
  }, [path, addBaseUrl]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex items-center justify-between rounded-md bg-muted border"
    >
      <div className="flex flex-grow items-center space-x-0">
        <RequestMethodCombobox
          method={method}
          handleMethodChange={handleMethodChange}
          allowUserToChange
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            try {
              const url = new URL(e.target.value);
              handlePathInputChange(url.pathname);
            } catch {
              // TODO - Error state? Toast?
              console.error("Invalid URL", e.target.value);
            }
          }}
          className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
        />
      </div>
      <div className="flex items-center space-x-2 p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="sm"
                type="submit"
                disabled={isRequestorRequesting}
                className="p-2 md:p-2.5"
              >
                <span className="hidden md:inline">Send</span>
                <TriangleRightIcon className="md:hidden w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-muted/75 text-white">
              <p>Send Request
                {/* Figoure ot if mac or other */}
              <Badge className="ml-1" variant="outline">⌘ + ↩</Badge>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </form>
  );
}
