import { cn } from "@/utils";
import { useActiveRoute } from "../../store";
import { useApiCallData } from "../../store/hooks/useApiCallData";
import { CopyAsCurl } from "./CopyAsCurl";
import {
  RequestBodyTypeDropdown,
  type RequestBodyTypeDropdownProps,
} from "./RequestBodyCombobox";

type BottomToolbarProps = Omit<
  RequestBodyTypeDropdownProps,
  "isDisabled" | "requestBody"
>;

export function BottomToolbar({
  handleRequestBodyTypeChange,
}: BottomToolbarProps) {
  const { method } = useActiveRoute();
  const { body } = useApiCallData("body");
  const isDropdownDisabled = method === "GET" || method === "HEAD";

  return (
    <div
      className={cn(
        "bg-muted",
        "flex justify-between absolute bottom-0 w-full border-t",
      )}
    >
      <RequestBodyTypeDropdown
        requestBody={body}
        handleRequestBodyTypeChange={handleRequestBodyTypeChange}
        isDisabled={isDropdownDisabled}
      />

      <CopyAsCurl />
    </div>
  );
}
