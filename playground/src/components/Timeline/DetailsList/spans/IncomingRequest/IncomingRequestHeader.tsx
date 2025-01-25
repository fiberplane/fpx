import { StatusCode } from "@/components/StatusCode";
import { SectionHeading } from "@/components/Timeline/shared";
import {
  cn,
  getHttpMethodTextColor,
  getMatchedRoute,
  getRequestMethod,
  getRequestUrl,
  getStatusCode,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";

type Props = Pick<OtelSpan, "attributes">;

export function IncomingRequestHeader(props: Props) {
  const { attributes } = props;

  const method = getRequestMethod({ attributes });
  const pathWithSearch = getRequestUrl({ attributes });
  const matchedRoute = getMatchedRoute({ attributes });
  const responseStatusCode = getStatusCode({ attributes });

  return (
    <div className="flex flex-col gap-2 justify-center">
      <SectionHeading className="flex items-center gap-2 max-lg:mt-[1px]">
        <StatusCode
          status={responseStatusCode}
          isFailure={false}
          className="text-xs py-0.5"
        />

        <div className="inline-flex gap-2 font-mono py-0.5 text-xs bg-accent rounded px-1 min-w-0">
          <span className={cn(getHttpMethodTextColor(method))}>{method}</span>
          <span className="text-gray-400 font-light text-nowrap text-ellipsis overflow-hidden">
            {pathWithSearch}
          </span>
        </div>
        {matchedRoute && (
          <div className="flex gap-2 p-1 text-xs bg-accent rounded">
            <span className="text-gray-200 text-xs">Route:</span>
            <span className="text-gray-400 font-mono inline-block text-xs">
              {matchedRoute}
            </span>
          </div>
        )}
      </SectionHeading>
    </div>
  );
}
