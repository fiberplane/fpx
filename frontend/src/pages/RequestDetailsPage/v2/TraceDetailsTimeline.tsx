import { formatDistanceToNow } from "date-fns";
import React from "react";

interface Span {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  name: string;
  trace_state: string;
  flags: number;
  kind: string;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
  attributes: Record<string, any>;
  status?: {
    code: string;
    message: string;
  };
  events: Array<{
    name: string;
    timestamp: string; // ISO 8601 format
    attributes: Record<string, any>;
  }>;
  links: Array<{
    trace_id: string;
    span_id: string;
    trace_state: string;
    attributes: Record<string, any>;
    flags: number;
  }>;
}

interface TraceDetailsTimelineProps {
  trace: Span[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "request":
      return "🔵";
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

// type NormalizedSpan = Span & {
//   duration: number;
// };

// const normalizeTraceDurations = (trace: Span[]) => {
//   const maxDuration = Math.max(...trace.map((span) => span.end_time));
//   return trace.map((span) => ({
//     ...span,
//     duration: Math.abs(new Date(span.end_time).getTime() - new Date(span.start_time).getTime()),
//   }));
// };

export const TraceDetailsTimeline: React.FC<TraceDetailsTimelineProps> = ({
  trace,
}) => {
  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <h3 className="text-lg mb-4">TIMELINE</h3>
      <div className="flex flex-col">
        {fakeData.map((span) => (
          <div key={span.span_id} className="flex items-center py-2">
            <div className="mr-2">{getTypeIcon(span.kind)}</div>
            <div className="flex flex-col">
              <div className="font-bold">{span.name}</div>
              <div className="text-gray-400 flex items-center">
                <div className="w-32 h-1 bg-blue-500 mx-2"></div>
                <span>
                  {formatDistanceToNow(new Date(span.start_time))} -{" "}
                  {formatDistanceToNow(new Date(span.end_time))}
                </span>
              </div>
            </div>
            <div className="ml-auto text-gray-400">
              {Math.abs(
                new Date(span.end_time).getTime() -
                  new Date(span.start_time).getTime(),
              )}{" "}
              ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Fake data for testing
const fakeData: Span[] = [
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
