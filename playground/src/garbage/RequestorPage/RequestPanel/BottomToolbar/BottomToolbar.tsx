import { cn } from "@/utils";
import { CopyAsCurl, type CopyAsCurlProps } from "./CopyAsCurl";
import {
  RequestBodyTypeDropdown,
  type RequestBodyTypeDropdownProps,
} from "./RequestBodyCombobox";

type BottomToolbarProps = CopyAsCurlProps &
  Omit<RequestBodyTypeDropdownProps, "isDisabled" | "requestBody">;

export function BottomToolbar({
  body,
  handleRequestBodyTypeChange,
  method,
  path,
  queryParams,
  requestHeaders,
}: BottomToolbarProps) {
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

      <CopyAsCurl
        method={method}
        body={body}
        path={path}
        queryParams={queryParams}
        requestHeaders={requestHeaders}
      />
    </div>
  );
}
