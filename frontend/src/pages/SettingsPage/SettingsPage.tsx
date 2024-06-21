import { Skeleton } from "@/components/ui/skeleton";
import { SwitchForm } from "./ExampleForm";
import { useFetchSettings } from "./queries";

export function SettingsPage() {
  const { data, isLoading, isError } = useFetchSettings();
  return (
    <div className="mt-4 max-w-[600px]">
      {
        isLoading ? (
          <Skeleton className="w-full h-24" />
        ) : isError ? (
          <div>Error Loading Settings</div>
        ) : (
          <SwitchForm settings={data?.content} />
        )
      }
    </div>
  )
}
