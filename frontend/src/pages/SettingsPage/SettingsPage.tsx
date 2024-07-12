import { Skeleton } from "@/components/ui/skeleton";
import { useFetchSettings } from "@/queries";
import { SettingsForm } from "./SettingsForm";

export function SettingsPage() {
  const { data, isLoading, isError } = useFetchSettings();
  return (
    <div className="mt-4 max-w-[600px] px-4 lg:px-6 overflow-y-scroll">
      {isLoading ? (
        <Skeleton className="w-full h-24" />
      ) : isError ? (
        <div>Error Loading Settings</div>
      ) : (
        <SettingsForm settings={data?.content} />
      )}
    </div>
  );
}
