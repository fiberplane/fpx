import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils";
import { RouteItem } from "./RoutesPanel";
import { ProbedRoute } from "./queries";

type RoutesComboboxProps = {
  routes?: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

export function RoutesCombobox(props: RoutesComboboxProps) {
  const { selectedRoute, routes, handleRouteClick } = props;
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | undefined>(
    selectedRoute ? `${selectedRoute.method}-${selectedRoute.path}` : undefined,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 bg-transparent mt-2"
        >
          Endpoints
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96 shadow-md" align="start">
        <Command className="bg-[rgb(12,18,32)]">
          <CommandInput placeholder="Search endpoints..." className="h-12" />
          <CommandList>
            <CommandEmpty>No endpoint found.</CommandEmpty>
            <CommandGroup>
              {routes?.map((route) => {
                const identifier = `${route.method}-${route.path}`;
                return (
                  <CommandItem
                    className="text-base"
                    key={identifier}
                    value={identifier}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      handleRouteClick(route);
                      setOpen(false);
                    }}
                  >
                    <RouteItem route={route} />
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === identifier ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
