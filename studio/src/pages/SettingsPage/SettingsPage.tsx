import SparkleWand from "@/assets/SparkleWand.svg";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFetchSettings } from "@/queries";
import { cn } from "@/utils";
import type { Settings } from "@fiberplane/fpx-types";
import { useState } from "react";
import { AISettingsForm } from "./AISettingsForm";
import { FpxWorkerProxySettingsForm } from "./FpxWorkerProxySettingsForm";
import { ProxyRequestsSettingsForm } from "./ProxyRequestsSettingsForm";

export function SettingsPage() {
  const { data, isPending, isError } = useFetchSettings();

  return (
    <div
      className={cn("mt-4 px-4 overflow-hidden h-full w-[950px]", "lg:px-6")}
    >
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
const FPX_WORKER_PROXY_TAB = "Production Ingestion";

function SettingsLayout({ settings }: { settings: Settings }) {
  const [activeTab, setActiveTab] = useState(AI_TAB);

  return (
    <Tabs
      defaultValue={AI_TAB}
      value={activeTab}
      onValueChange={setActiveTab}
      className="grid h-full gap-4 overflow-hidden md:grid-cols-[auto_1fr] md:gap-2 lg:gap-4"
    >
      <TabsList
        className={cn(
          "w-full",
          "border",
          "p-0",
          "md:border-0",
          "gap-2",
          "grid grid-flow-col md:grid-flow-row auto-cols-max md:auto-cols-auto",
          "overflow-x-auto md:overflow-x-visible",
          "md:w-[160px]",
          "lg:w-[200px]",
          "bg-transparent",
        )}
      >
        <TabsTrigger
          className="whitespace-nowrap justify-start text-left px-4"
          value={AI_TAB}
        >
          <SparkleWand className="inline w-3.5 h-3.5 mr-1.5" />
          Request Autofill
        </TabsTrigger>
        <TabsTrigger
          className="whitespace-nowrap justify-start text-left px-4"
          value={PROXY_REQUESTS_TAB}
        >
          Proxy Requests
        </TabsTrigger>
        <TabsTrigger
          className="whitespace-nowrap justify-start text-left px-4"
          value={FPX_WORKER_PROXY_TAB}
        >
          {FPX_WORKER_PROXY_TAB}
        </TabsTrigger>
      </TabsList>
      <div className="w-full max-w-[900px] overflow-y-auto">
        <TabsContent className="m-0" value={AI_TAB}>
          <AISettingsForm settings={settings} />
        </TabsContent>
        <TabsContent className="m-0" value={PROXY_REQUESTS_TAB}>
          <ProxyRequestsSettingsForm settings={settings} />
        </TabsContent>
        <TabsContent className="m-0" value={FPX_WORKER_PROXY_TAB}>
          <FpxWorkerProxySettingsForm settings={settings} />
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
