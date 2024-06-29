import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { RequestMethodCombobox } from "../RequestMethodCombobox";
import { useAddRoute } from "../queries";

export function AddRouteButton() {
  const { mutate: addRoute } = useAddRoute();

  const [method, setMethod] = useState("GET");
  const handleMethodChange = (method: string) => {
    setMethod(method);
  };
  const [path, setPath] = useState("");
  const handlePathInputChange = (newPath: string) => {
    setPath(newPath);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitting", method, path);
    addRoute({ path, method });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="p-2.5">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <form
          onSubmit={onSubmit}
          // className="flex items-center justify-between rounded-md bg-muted border"
          className="grid gap-4"
        >
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Route</h4>
            <p className="text-sm text-muted-foreground">
              Create a custom api route for testing
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr]">
            <div className="grid items-center">
              <Label className="sr-only" htmlFor="width">
                Method
              </Label>
              <RequestMethodCombobox
                method={method}
                handleMethodChange={handleMethodChange}
                allowUserToChange
                className="p-1"
              />
            </div>
            <div className="grid items-center">
              <Label className="sr-only" htmlFor="pathPattern">
                Path Pattern
              </Label>
              <Input
                id="pathPattern"
                type="text"
                onChange={(e) => {
                  handlePathInputChange(e.target.value);
                }}
                value={path}
                className="col-span-2 h-8 font-mono"
              />
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
