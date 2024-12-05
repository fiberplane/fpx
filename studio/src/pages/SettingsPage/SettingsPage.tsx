import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeature } from "@/hooks";
import { type UserInfo, useFetchSettings, useUserInfo } from "@/queries";
import { cn } from "@/utils";
import type { Settings } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useStudioStore } from "../RequestorPage/store";
import { AISettingsForm } from "./AISettingsForm";
import { FpxWorkerProxySettingsForm } from "./FpxWorkerProxySettingsForm";
import { OpenAPISettingsForm } from "./OpenAPISettingsForm";
import { Profile } from "./Profile";
import { ProxyRequestsSettingsForm } from "./ProxyRequestsSettingsForm";

export function SettingsPage() {
  const user = useUserInfo();
  const { data, isPending, isError } = useFetchSettings();

  return (
    <div
      className={cn(
        "mt-8 px-8 overflow-hidden h-full",
        "md:mt-6 md:min-w-[690px]",
        "lg:w-[960px]",
      )}
    >
      {isPending ? (
        <SettingsSkeleton />
      ) : isError ? (
        <div>Error Loading Settings</div>
      ) : (
        <SettingsLayout settings={data} user={user} />
      )}
    </div>
  );
}

const PROFILE_TAB = "Profile";
// Exported allow us to navigate to this tab from the requestor page
export const AI_TAB = "AI";
const OPENAPI_TAB = "OpenAPI";
const PROXY_REQUESTS_TAB = "Proxy Requests";
const FPX_WORKER_PROXY_TAB = "Production Ingestion";

export const isValidSettingsTab = (
  tab: string,
): tab is
  | typeof PROFILE_TAB
  | typeof AI_TAB
  | typeof PROXY_REQUESTS_TAB
  | typeof FPX_WORKER_PROXY_TAB => {
  return (
    tab === PROFILE_TAB ||
    tab === AI_TAB ||
    tab === PROXY_REQUESTS_TAB ||
    tab === FPX_WORKER_PROXY_TAB
  );
};

function SettingsLayout({
  settings,
  user,
}: { settings: Settings; user?: UserInfo | null }) {
  const { defaultSettingsTab } = useStudioStore("defaultSettingsTab");
  const settingsTabFallback = user ? PROFILE_TAB : AI_TAB;
  const defaultTab = defaultSettingsTab ?? settingsTabFallback;
  const [activeTab, setActiveTab] = useState(defaultTab);

  // To enable the custom spec url feature, set `fpx.openApiSettings` to "true" in localStorage
  const isOpenAPISettingsEnabled = useFeature("openApiSettings");

  return (
    <Tabs
      defaultValue={PROFILE_TAB}
      value={activeTab}
      onValueChange={setActiveTab}
      className="grid h-full gap-8 overflow-hidden max-md:grid-rows-[auto_1fr] md:grid-cols-[auto_1fr] md:gap-2 lg:gap-4"
    >
      <TabsList
        className={cn(
          "border",
          "p-0",
          "md:border-0",
          "gap-2",
          "grid grid-flow-col md:grid-flow-row auto-cols-max md:auto-cols-auto",
          "overflow-x-auto md:overflow-x-visible",
          "md:w-[200px]",
          "md:justify-start",
          "bg-transparent",
        )}
      >
        <TabsTrigger
          className="whitespace-nowrap justify-start text-left pl-0 pr-4"
          value={PROFILE_TAB}
        >
          <Icon icon="lucide:user" className={cn("w-3.5 h-3.5 mr-1.5")} />
          You
        </TabsTrigger>

        {isOpenAPISettingsEnabled && (
          <TabsTrigger
            className="whitespace-nowrap justify-start text-left pl-0 pr-4"
            value={OPENAPI_TAB}
          >
            <Icon
              icon="lucide:file-code"
              className={cn("w-3.5 h-3.5 mr-1.5")}
            />
            OpenAPI
          </TabsTrigger>
        )}

        <TabsTrigger
          className="whitespace-nowrap justify-start text-left pl-0 pr-4"
          value={AI_TAB}
        >
          <Icon
            icon="lucide:wand-sparkles"
            className={cn("w-3.5 h-3.5 mr-1.5")}
          />
          Request Autofill
        </TabsTrigger>
        <TabsTrigger
          className="whitespace-nowrap justify-start text-left pl-0 pr-4"
          value={PROXY_REQUESTS_TAB}
        >
          <Icon icon="lucide:waypoints" className={cn("w-3.5 h-3.5 mr-1.5")} />
          Proxy
        </TabsTrigger>
        <TabsTrigger
          className="whitespace-nowrap justify-start text-left pl-0 pr-4"
          value={FPX_WORKER_PROXY_TAB}
        >
          <Icon
            icon="lucide:cloud-upload"
            className={cn("w-3.5 h-3.5 mr-1.5")}
          />
          Production
        </TabsTrigger>
      </TabsList>
      <div className="w-full max-w-[680px] overflow-y-auto">
        <TabsContent className="m-0" value={PROFILE_TAB}>
          <Profile settings={settings} />
        </TabsContent>
        <TabsContent className="m-0" value={OPENAPI_TAB}>
          <OpenAPISettingsForm settings={settings} />
        </TabsContent>
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
      <div className="w-full max-w-[680px] lg:w-[200px] space-y-2">
        <Skeleton className="w-full h-9" />
        <Skeleton className="w-full h-9 hidden lg:block" />
        <Skeleton className="w-full h-9 hidden lg:block" />
        <Skeleton className="w-full h-9 hidden lg:block" />
        <Skeleton className="w-full h-9 hidden lg:block" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="w-full max-w-[680px] h-36" />
        <Skeleton className="w-full max-w-[680px] h-36" />
        <Skeleton className="w-full max-w-[680px] h-36 hidden sm:block" />
      </div>
    </div>
  );
}
