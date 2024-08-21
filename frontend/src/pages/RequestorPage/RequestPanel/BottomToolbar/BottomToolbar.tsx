import { CopyAsCurl, CopyAsCurlProps } from "./CopyAsCurl";
import {
  RequestBodyTypeDropdown,
  RequestBodyTypeDropdownProps,
} from "./RequestBodyCombobox";

type BottomToolbarProps = RequestBodyTypeDropdownProps & CopyAsCurlProps;

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
    <div className="flex justify-between gap-2 absolute bottom-0 w-full p-2 backdrop-blur-sm border-t">
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
