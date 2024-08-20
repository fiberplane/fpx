import SparkleWand from "@/assets/SparkleWand.svg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFetchSettings } from "@/queries";
import { cn } from "@/utils";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { AISettingsForm } from "./AISettingsForm";
import { ProxyRequestsSettingsForm } from "./ProxyRequestsSettingsForm";

export function SettingsPage() {
  const { data, isPending, isError } = useFetchSettings();
  return (
    <div className={cn("mt-4 px-4 overflow-hidden h-full", "lg:px-6")}>
      {isPending ? (
        <SettingsSkeleton />
      ) : isError ? (
        <div>Error Loading Settings</div>
      ) : (
        <SettingsLayout settings={data} />
      )}
    </div>
  );
}

const AI_TAB = "AI";
const PROXY_REQUESTS_TAB = "Proxy Requests";

function SettingsLayout({ settings }: { settings: Record<string, string> }) {
  const [activeTab, setActiveTab] = useState(AI_TAB);

  return (
    <Tabs
      defaultValue={AI_TAB}
      value={activeTab}
      onValueChange={setActiveTab}
      className="grid max-md:grid-rows-[auto_1fr] h-full gap-4 overflow-hidden md:grid-cols-[auto_1fr] md:gap-2 lg:gap-4"
    >
      <TabsList
        className={cn(
          "w-full md:h-auto",
          "border",
          "p-0",
          "md:p-2 md:border-0",
          "flex flex-col items-start justify-start",
          "md:w-[160px]",
          "lg:w-[200px]",
          "bg-transparent",
        )}
      >
        {/* For smaller screens, show a dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full px-4 py-2 text-gray-200",
                "flex justify-between items-center",
                "md:hidden",
              )}
            >
              {activeTab}
              <CaretDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw-2rem)] min-w-[360px] sm:min-w-[400px] md:hidden"
            align="start"
          >
            <DropdownMenuItem onClick={() => setActiveTab(AI_TAB)}>
              {AI_TAB}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab(PROXY_REQUESTS_TAB)}>
              {PROXY_REQUESTS_TAB}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* For md breakpoint, show tab triggers */}
        <TabsTrigger
          className="hidden md:block w-full justify-start text-left py-2 px-4"
          value={AI_TAB}
        >
          <SparkleWand className="inline w-3.5 h-3.5 mr-1.5" />
          Request Autofill
        </TabsTrigger>
        <TabsTrigger
          className="hidden md:block w-full justify-start text-left py-2 px-4"
          value={PROXY_REQUESTS_TAB}
        >
          Proxy Requests
        </TabsTrigger>
      </TabsList>
      <div className="w-full md:py-3 max-w-[900px] overflow-hidden overflow-y-scroll">
        <TabsContent className="m-0" value={AI_TAB}>
          <AISettingsForm settings={settings} />
        </TabsContent>
        <TabsContent className="m-0" value={PROXY_REQUESTS_TAB}>
          <ProxyRequestsSettingsForm settings={settings} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:gap-4">
      <div className="w-full max-w-[900px] lg:w-[200px] space-y-2">
        <Skeleton className="w-full h-9" />
        <Skeleton className="w-full h-9 hidden lg:block" />
        <Skeleton className="w-full h-9 hidden lg:block" />
        <Skeleton className="w-full h-9 hidden lg:block" />
        <Skeleton className="w-full h-9 hidden lg:block" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="w-full max-w-[900px] h-36" />
        <Skeleton className="w-full max-w-[900px] h-36" />
        <Skeleton className="w-full max-w-[900px] h-36 hidden sm:block" />
      </div>
    </div>
  );
}
