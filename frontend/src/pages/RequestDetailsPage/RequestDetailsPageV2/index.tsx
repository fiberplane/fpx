import { Hackadoodle } from "./Hackadoodle";
import { Otel } from "./Otel";

export function RequestDetailsPageV2(props: {
  traceId: string;
  otel: boolean;
}) {
  const { traceId, otel } = props;

  if (otel) {
    return <Otel traceId={traceId} />;
  }

  return <Hackadoodle traceId={traceId} />;
}
