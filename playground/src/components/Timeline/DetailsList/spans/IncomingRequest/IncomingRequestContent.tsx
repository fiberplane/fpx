import {
  CollapsibleSubSection,
  SubSection,
  SubSectionHeading,
} from "@/components/Timeline/shared";
import {
  SENSITIVE_HEADERS,
  getRequestBody,
  getRequestEnv,
  getRequestHeaders,
  getResponseBody,
  getResponseHeaders,
  isSensitiveEnvVar,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { CollapsibleKeyValueTableV2 } from "../../KeyValueTableV2/KeyValueTable";
import { TextOrJsonViewer } from "@/components/ResponseBody";

type Props = Pick<OtelSpan, "attributes">;

export function IncomingRequestContent(props: Props) {
  const { attributes } = props;
  const requestHeaders = getRequestHeaders({ attributes });
  const requestBody = getRequestBody({ attributes });
  const responseHeaders = getResponseHeaders({ attributes });
  const responseBody = getResponseBody({ attributes });
  const requestEnv = getRequestEnv({ attributes });

  return (
    <div
      className="py-2 grid gap-4"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.stopPropagation();
        }
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div>
        <SubSection>
          <SubSectionHeading>Request</SubSectionHeading>
          <CollapsibleKeyValueTableV2
            title="Environment Vars"
            keyValue={requestEnv}
            defaultCollapsed
            sensitiveKeys={isSensitiveEnvVar}
            emptyMessage="No environment vars found"
            keyCellClassName="w-[96px] lg:w-[96px] lg:min-w-[96px]"
          />
        </SubSection>
        <SubSection>
          <CollapsibleKeyValueTableV2
            keyValue={requestHeaders}
            title=" Headers"
            sensitiveKeys={SENSITIVE_HEADERS}
          />
        </SubSection>
      </div>
      {requestBody && (
        <SubSection>
          <SubSectionHeading>Request Body</SubSectionHeading>
          <TextOrJsonViewer text={requestBody} textMaxPreviewLines={15} />
        </SubSection>
      )}
      <div>
        <SubSectionHeading>Response</SubSectionHeading>
        <div>
          <SubSection>
            <CollapsibleKeyValueTableV2
              keyValue={responseHeaders}
              title="Headers"
              sensitiveKeys={SENSITIVE_HEADERS}
            />
          </SubSection>

          {responseBody && (
            <CollapsibleSubSection heading="Body" defaultCollapsed={false}>
              <TextOrJsonViewer text={responseBody} textMaxPreviewLines={15} />
            </CollapsibleSubSection>
          )}
        </div>
      </div>
    </div>
  );
}
