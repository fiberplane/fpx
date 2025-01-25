import { StatusCode } from "@/components/StatusCode";
import {
  cn,
  getHttpMethodTextColor,
  getRequestMethod,
  getRequestUrl,
  getStatusCode,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";

type Props = Pick<OtelSpan, "attributes">;

export function FetchSpanHeader(props: Props) {
  const { attributes } = props;
  const method = getRequestMethod({ attributes });
  const url = getRequestUrl({ attributes });
  const statusCode = getStatusCode({ attributes });

  return (
    <div className="flex gap-2 items-center min-w-0">
      {statusCode !== undefined && (
        <StatusCode
          status={statusCode}
          isFailure={!statusCode}
          className="py-0.5"
        />
      )}
      <div className="flex gap-2 font-mono py-1 text-xs px-2 bg-accent/80 rounded text-muted-foreground min-w-0">
        <span className={cn("uppercase", getHttpMethodTextColor(method))}>
          {method}
        </span>
        <span className="text-nowrap text-ellipsis overflow-hidden" title={url}>
          {url}
        </span>
      </div>
    </div>
  );
}
