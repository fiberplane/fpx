import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { BACKGROUND_LAYER } from "../styles";
import { RoutesPanel } from "./RoutesPanel";

export function NavigationPanel() {
  return (
    <div
      className={cn(
        BACKGROUND_LAYER,
        "px-4 overflow-hidden border rounded-md",
        "h-full",
        "flex",
        "flex-col",
      )}
    >
      <Tabs defaultValue="routes">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="routes">
          <RoutesPanel />
        </TabsContent>
        <TabsContent value="requests">
          <div>Da history</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
