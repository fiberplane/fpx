import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { CommandDialog } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlusIcon } from "@radix-ui/react-icons";
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "@scalar/openapi-types";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { RequestMethodCombobox } from "../RequestMethodCombobox";
import { type Route, useAddRoutes, useOpenApiParse } from "../queries";
import type { RequestMethodInputValue } from "../types";

export function AddRouteButton() {
  useHotkeys("c", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  const [open, setOpen] = useState(false);
  const [openApi, setOpenApi] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="p-2.5">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          className="bg-slate-900 px-2 py-1.5 text-white flex gap-1.5"
          align="end"
        >
          Add a custom route or OpenAPI spec
          <div className="flex gap-0.5">
            <KeyboardShortcutKey>C</KeyboardShortcutKey>
          </div>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96 max-lg:hidden">
        {/* default tab opens on openapi if there is no openapi spec added already */}
        <AddRoutesTabs
          setOpen={setOpen}
          openApi={openApi}
          setOpenApi={setOpenApi}
        />
      </PopoverContent>
    </Popover>
  );
}

type AddRoutesTabsProps = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openApi: boolean;
  setOpenApi: React.Dispatch<React.SetStateAction<boolean>>;
};

function AddRoutesTabs({ setOpen, setOpenApi }: AddRoutesTabsProps) {
  return (
    <Tabs className="w-full" defaultValue="custom-route">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="custom-route">Custom Route</TabsTrigger>
        <TabsTrigger value="openapi">OpenAPI</TabsTrigger>
      </TabsList>
      <TabsContent value="custom-route">
        <CustomRouteForm setOpen={setOpen} />
      </TabsContent>
      <TabsContent value="openapi">
        <OpenApiForm setOpen={setOpen} setOpenApi={setOpenApi} />
      </TabsContent>
    </Tabs>
  );
}

export function AddRoutesDialog({
  open,
  setOpen,
  openApi,
  setOpenApi,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openApi: boolean;
  setOpenApi: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    // Use CommandDialog since this will render in a command menu
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="px-4 pt-12 pb-6">
        <AddRoutesTabs
          setOpen={setOpen}
          openApi={openApi}
          setOpenApi={setOpenApi}
        />
      </div>
    </CommandDialog>
  );
}

type OpenAPIFormData = {
  openApiSpec: string;
};

// catch all types for versioned OpenAPI spec
type PathObject =
  | OpenAPIV3.PathItemObject
  | OpenAPIV3_1.PathItemObject
  | OpenAPIV2.PathItemObject;
type OperationObject =
  | OpenAPIV3.OperationObject
  | OpenAPIV3_1.OperationObject
  | OpenAPIV2.OperationObject;

function OpenApiForm({
  setOpen,
  setOpenApi,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenApi: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    register,
    watch,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
  } = useForm<OpenAPIFormData>();

  const { mutate: addRoutes } = useAddRoutes();
  const { mutateAsync: parseAndValidate, isPending } = useOpenApiParse(
    watch("openApiSpec"),
  );

  const validateOpenApi = async (openApiSpec: string) => {
    try {
      await parseAndValidate(openApiSpec);
      return true;
    } catch (error) {
      return false;
    }
  };

  const onSubmit = async (data: OpenAPIFormData) => {
    try {
      // Because we're passing the same stringified spec it should return the cached version
      const schema = await parseAndValidate(data.openApiSpec);

      if (!schema) {
        throw new Error("Invalid OpenAPI spec");
      }

      setOpen(false);

      const submissionRoutes: Route[] = schema.paths
        ? Object.entries(schema.paths).flatMap(
            ([path, pathObj]: [string, PathObject]) => {
              // destructure the params so we don't include them
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { parameters, ...pathObjWithoutParams } = pathObj;
              return Object.entries(pathObjWithoutParams).map(
                ([method, operation]: [string, OperationObject]) => {
                  const seen = new WeakSet();
                  return {
                    path: path.replace(/{(.*?)}/g, ":$1"),
                    method: method.toUpperCase(),
                    handlerType: "route" as const,
                    routeOrigin: "open_api" as const,
                    openApiSpec: JSON.stringify(operation, (_key, value) => {
                      if (typeof value === "object" && value !== null) {
                        if (seen.has(value)) {
                          return "[Circular]";
                        }
                        seen.add(value);
                      }
                      return value;
                    }),
                  };
                },
              );
            },
          )
        : [];

      addRoutes(submissionRoutes);
    } catch (error) {
      console.error("Error parsing OpenAPI spec:", error);
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    setValue("openApiSpec", pastedText, { shouldValidate: true });
    const isValid = await trigger("openApiSpec");
    if (isValid) {
      setOpenApi(true);
      handleSubmit(onSubmit)();
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Add routes defined in an OpenAPI spec
        </p>
      </div>
      <div>
        <div className="grid gap-4">
          <Textarea
            {...register("openApiSpec", { validate: validateOpenApi })}
            className="w-full h-8 font-mono"
            placeholder="Paste your OpenAPI spec here"
            onPaste={onPaste}
            autoFocus
          />
          {isPending && <p className="text-sm">Validating OpenAPI spec...</p>}
          {errors.openApiSpec && (
            <p className="text-sm text-red-500">Invalid OpenAPI spec</p>
          )}
        </div>
      </div>
    </form>
  );
}

type CustomRouteFormData = {
  method: string;
  path: string;
};

function CustomRouteForm({
  setOpen,
}: { setOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  const { register, handleSubmit, watch } = useForm<CustomRouteFormData>();

  const { mutate: addRoutes } = useAddRoutes();

  const [method, setMethod] = useState("GET");
  const handleMethodChange = (method: string) => {
    setMethod(method);
  };
  const onSubmit: SubmitHandler<CustomRouteFormData> = ({ path }) => {
    const isWs = method === "WS";
    addRoutes({
      path,
      method: isWs ? "GET" : method,
      routeOrigin: "custom",
      handlerType: "route",
      requestType: isWs ? "websocket" : "http",
    });
    setOpen(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      // className="flex items-center justify-between rounded-md bg-muted border"
      className="grid gap-4"
    >
      <div className="space-y-2">
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
            {...register("method")}
            method={method as RequestMethodInputValue}
            handleMethodChange={handleMethodChange}
            allowUserToChange
            className="px-2 mr-2"
          />
        </div>
        <div className="grid items-center">
          <Label className="sr-only" htmlFor="pathPattern">
            Path Pattern
          </Label>
          <Input
            {...register("path")}
            id="pathPattern"
            type="text"
            className="col-span-2 h-8 font-mono"
            autoFocus
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" className="h-7" disabled={!watch("path")}>
          Add
        </Button>
      </div>
    </form>
  );
}
