import { cn } from "@/utils";
import { useRequestorStore } from "../store"; // We'll create this Zustand store
import { BACKGROUND_LAYER } from "../styles";
import { RoutesPanel } from "./RoutesPanel"; // Assuming this component exists

export function NavigationPanel() {
  const routes = useRequestorStore((state) => state.routes);
  const selectedRoute = useRequestorStore((state) => state.selectedRoute);
  const handleRouteClick = useRequestorStore((state) => state.selectRoute);
  const history = useRequestorStore((state) => state.history);
  const loadHistoricalRequest = useRequestorStore(
    (state) => state.loadHistoricalRequest,
  );
  const removeServiceUrlFromPath = useRequestorStore(
    (state) => state.removeServiceUrlFromPath,
  );

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
      <RoutesPanel
        routes={routes}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
        history={history}
        loadHistoricalRequest={loadHistoricalRequest}
        removeServiceUrlFromPath={removeServiceUrlFromPath}
      />
    </div>
  );
}
