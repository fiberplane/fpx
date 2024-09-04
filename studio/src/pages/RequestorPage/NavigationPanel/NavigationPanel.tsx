import { cn } from "@/utils";
import { BACKGROUND_LAYER } from "../styles";
import { RoutesPanel } from "./RoutesPanel";

type Props = {
  deleteDraftRoute?: () => void;
};

export function NavigationPanel(props: Props) {

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
        deleteDraftRoute={props.deleteDraftRoute}
      />
    </div>
  );
}
