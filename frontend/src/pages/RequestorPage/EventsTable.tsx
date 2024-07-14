import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  MizuLog,
  isMizuErrorMessage,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchStartMessage,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
} from "@/queries";
import {
  hasStringMessage,
  renderFullLogMessage,
  truncateWithEllipsis,
} from "@/utils";
import { useMemo } from "react";

export function EventsTable({ logs }: { logs?: MizuLog[] }) {
  const filteredLogs = useMemo(() => {
    return logs?.filter((log) => {
      return (
        !isMizuRequestStartMessage(log.message) &&
        !isMizuRequestEndMessage(log.message)
      );
    });
  }, [logs]);

  if (!filteredLogs || !filteredLogs.length) {
    return (
      <div className="pl-8 text-gray-400 font-italic text-sm pb-2">
        <div>No logs</div>
      </div>
    );
  }

  return (
    <Table>
      <TableBody>
        {filteredLogs.map((log) => (
          <EventTableRow key={log.id} log={log} />
        ))}
      </TableBody>
    </Table>
  );
}

const EventTableRow = ({ log }: { log: MizuLog }) => {
  const description = useMemo(
    () => truncateWithEllipsis(getEventDescription(log), 55),
    [log],
  );
  const eventName = useMemo(() => getEventName(log), [log]);
  return (
    <TableRow key={log.id}>
      <TableCell className="w-[100px] text-gray-400">{eventName}</TableCell>
      <TableCell>{description}</TableCell>
    </TableRow>
  );
};

function getEventName(log: MizuLog) {
  if (isMizuFetchStartMessage(log?.message)) {
    return "fetch start";
  }
  if (isMizuFetchErrorMessage(log?.message)) {
    return "fetch error";
  }
  if (isMizuFetchEndMessage(log?.message)) {
    return "fetch end";
  }
  if (log.level === "error") {
    return <span className="text-red-400">error log</span>;
  }
  return `${log.level} log`;
}

function getEventDescription(log: MizuLog) {
  if (isMizuFetchStartMessage(log?.message)) {
    return `${log.message.method} ${log.message.url}`;
  }
  if (isMizuFetchErrorMessage(log?.message)) {
    return `\t${log.message.url}`;
  }
  if (isMizuFetchEndMessage(log?.message)) {
    return `\t${log.message.url}`;
  }
  if (isMizuErrorMessage(log?.message)) {
    return log.message.message;
  }
  if (log.args?.length > 0) {
    return renderFullLogMessage([log?.message, ...log.args]);
  }
  if (hasStringMessage(log.message)) {
    return log.message.message;
  }
  if (typeof log?.message === "string") {
    return log.message;
  }
  return JSON.stringify(log.message).slice(0, 33);
}
