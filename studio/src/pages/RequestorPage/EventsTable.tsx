import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { OtelEvent } from "@fiberplane/fpx-types";
import { getString, truncateWithEllipsis } from "@/utils";
import { useMemo } from "react";

export function EventsTable({ events }: { events?: OtelEvent[] }) {
  if (!events || !events.length) {
    return (
      <div className="pl-8 text-gray-400 font-italic text-sm pb-2">
        <div>No logs</div>
      </div>
    );
  }

  return (
    <Table>
      <TableBody>
        {events.map((event, index) => (
          <EventTableRow key={index} event={event} />
        ))}
      </TableBody>
    </Table>
  );
}

const EventTableRow = ({ event }: { event: OtelEvent }) => {
  const description = useMemo(
    () => truncateWithEllipsis(getEventDescription(event), 55),
    [event],
  );
  const eventName = useMemo(() => getEventName(event), [event]);
  return (
    <TableRow>
      <TableCell className="w-[100px] text-gray-400">{eventName}</TableCell>
      <TableCell>{description}</TableCell>
    </TableRow>
  );
};

function getEventName(event: OtelEvent) {
  if (event.name === "log") {
    return getString(event.attributes.level) ?? "log";
  }
  return event.name;
}

function getEventDescription(event: OtelEvent) {
  if (event.name === "exception") {
    return getString(event.attributes["exception.message"]) || "<no message>";
  }
  if (event.name === "log") {
    return getString(event.attributes.message) || "<no message>";
  }
}
