import { MizuSpan, MizuTraceV2 } from "@/queries";
import { formatDistanceStrict } from "date-fns";
import React, { useMemo } from "react";

const formatDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60 * 1000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  const duration = formatDistanceStrict(startDate, endDate, {
    unit: "minute",
  });

  return duration
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m");
};

type TraceDetailsTimelineProps = {
  trace: MizuTraceV2;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "request":
    case "SERVER":
      return "🔵";
    case "CLIENT":
    case "fetch":
      return "🔶";
    case "log":
      return "🔸";
    case "event":
      return "🔹";
    case "db":
      return "🗄️";
    case "response":
      return "🔵";
    default:
      return "🔸";
  }
};

type NormalizedSpan = MizuSpan & {
  normalized_start_time: number;
  normalized_end_time: number;
  normalized_duration: number;
}


type MizuTraceV2Normalized = MizuTraceV2 & {
  normalizedSpans: Array<NormalizedSpan>;
};

const normalizeSpanDurations = (trace: MizuTraceV2): MizuTraceV2Normalized => {
  const minStart = Math.min(
    ...trace.spans.map((span) => new Date(span.start_time).getTime()),
  );
  const maxEnd = Math.max(
    ...trace.spans.map((span) => new Date(span.end_time).getTime()),
  );
  const normalizedSpans = trace.spans.map((span) => {
    const startTime = new Date(span.start_time).getTime();
    const endTime = new Date(span.end_time).getTime();
    return {
      ...span,
      normalized_start_time:
        (startTime - minStart) / (maxEnd - minStart),
      normalized_end_time:
        (endTime - minStart) / (maxEnd - minStart),
      normalized_duration: (endTime - startTime) / (maxEnd - minStart),
    };
  });

  return {
    ...trace,
    normalizedSpans,
  };
};

export const TraceDetailsTimeline: React.FC<TraceDetailsTimelineProps> = ({
  trace,
}) => {
  const normalizedTrace = useMemo(() => normalizeSpanDurations(trace), [trace]);
  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <h3 className="text-lg mb-4">TIMELINE</h3>
      <div className="flex flex-col">
        {normalizedTrace.normalizedSpans.map((span) => (
          <NormalizedSpanRow key={span.span_id} span={span} />
        ))}
      </div>
    </div>
  );
};

const NormalizedSpanRow: React.FC<{ span: NormalizedSpan }> = ({ span }) => {
  const lineWidth = `${span.normalized_duration * 100}%`;
  const lineOffset = `${span.normalized_start_time * 100}%`;
  return (
    <div key={span.span_id} className="flex items-center py-2">
      <div className="mr-2">{getTypeIcon(span.kind)}</div>
      <div className="flex flex-col w-[115px]">
        <div className="font-bold truncate">{span.name}</div>
      </div>
      <div className="text-gray-400 flex flex-grow items-center mx-2">
        <div className="h-1 min-w-1 bg-blue-500" style={{ width: lineWidth, marginLeft: lineOffset }}></div>
      </div>
      <div className="ml-auto text-gray-400 text-xs w-[25px]">
        {formatDuration(span.start_time, span.end_time)}
      </div>
    </div>
  );
};

// Fake data for testing
const fakeData: MizuTraceV2[] = [
  {
    trace_id: "1",
    span_id: "1",
    name: "Incoming request",
    trace_state: "",
    flags: 0,
    kind: "request",
    start_time: new Date(Date.now() - 432000).toISOString(),
    end_time: new Date(Date.now() - 431000).toISOString(),
    attributes: {},
    events: [],
    links: [],
  },
  {
    trace_id: "1",
    span_id: "2",
    name: "fetch",
    trace_state: "",
    flags: 0,
    kind: "fetch",
    start_time: new Date(Date.now() - 184000).toISOString(),
    end_time: new Date(Date.now() - 183000).toISOString(),
    attributes: {},
    events: [],
    links: [],
  },
  {
    trace_id: "1",
    span_id: "3",
    name: "Log",
    trace_state: "",
    flags: 0,
    kind: "log",
    start_time: new Date(Date.now() - 1000).toISOString(),
    end_time: new Date(Date.now() - 900).toISOString(),
    attributes: {},
    events: [],
    links: [],
  },
  {
    trace_id: "1",
    span_id: "4",
    name: "Event",
    trace_state: "",
    flags: 0,
    kind: "event",
    start_time: new Date(Date.now() - 84000).toISOString(),
    end_time: new Date(Date.now() - 83000).toISOString(),
    attributes: {},
    events: [],
    links: [],
  },
  {
    trace_id: "1",
    span_id: "5",
    name: "INSERT",
    trace_state: "",
    flags: 0,
    kind: "db",
    start_time: new Date(Date.now() - 37000).toISOString(),
    end_time: new Date(Date.now() - 36000).toISOString(),
    attributes: {},
    events: [],
    links: [],
  },
  {
    trace_id: "1",
    span_id: "6",
    name: "Outgoing response",
    trace_state: "",
    flags: 0,
    kind: "response",
    start_time: new Date(Date.now() - 92000).toISOString(),
    end_time: new Date(Date.now() - 91000).toISOString(),
    attributes: {},
    events: [],
    links: [],
  },
];

// Render the component with fake data for testing
const App: React.FC = () => {
  return <TraceDetailsTimeline trace={fakeData} />;
};

export default App;
