import { Otel } from "./Otel";

export function RequestDetailsPageV2(props: {
  traceId: string;
}) {
  const { traceId } = props;

  return <Otel traceId={traceId} />;
}
