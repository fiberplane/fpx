import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriangleRightIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { getUrl } from "./queries";

type RequestInputProps = {
  method: string;
  setMethod: (method: string) => void;
  path?: string;
  setPath: (path: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isRequestorRequesting?: boolean;
};

export function RequestorInput({
  method,
  setMethod,
  path,
  setPath,
  onSubmit,
  isRequestorRequesting,
}: RequestInputProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const url = getUrl(path);
    setValue(url);
  }, [path]);

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center justify-between rounded-md bg-muted border"
    >
      <div className="flex flex-grow items-center space-x-0">
        <RequestMethodCombobox
          method={method}
          setMethod={setMethod}
          allowUserToChange={false}
        />
        <Input
          readOnly // FIXME - We want to make this dynamic but it's a little weird with path params, etc
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            try {
              const url = new URL(e.target.value);
              setPath(url.pathname);
            } catch {
              // TODO - Error state
              console.error("Invalid URL", e.target.value);
            }
          }}
          className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
        />
      </div>
      <div className="flex items-center space-x-2 p-2">
        <Button
          size="sm"
          type="submit"
          disabled={isRequestorRequesting}
          className="p-2 md:p-2.5"
        >
          <span className="hidden md:inline">Send</span>
          <TriangleRightIcon className="md:hidden w-6 h-6" />
        </Button>
      </div>
    </form>
  );
}
