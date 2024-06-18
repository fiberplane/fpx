import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { MizuLog, isMizuErrorMessage, isMizuFetchEndMessage, isMizuFetchErrorMessage, isMizuFetchStartMessage, isMizuRequestEndMessage, isMizuRequestStartMessage } from "@/queries";
import { useMemo } from "react";

export function EventsTable({ logs }: { logs?: MizuLog[] }) {
  const filteredLogs = useMemo(() => {
    return logs?.filter(log => {
      return !isMizuRequestStartMessage(log.message) && !isMizuRequestEndMessage(log.message)
    })
  }, [logs])

  if (!filteredLogs) {
    return <div className="p-4">No logs</div>;
  }

  console.log('fil', filteredLogs)

  return (
    <Table>
      <TableBody>
        {filteredLogs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="w-[100px]">{getEventName(log)}</TableCell>
            <TableCell>{getEventDescription(log)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getEventName(log: MizuLog) {
  if (isMizuFetchStartMessage(log?.message)) {
    return 'fetch start'
  }
  if (isMizuFetchErrorMessage(log?.message)) {
    return 'fetch error'
  }
  if (isMizuFetchEndMessage(log?.message)) {
    return 'fetch end'
  }
  if (log.level === 'error') {
    return 'error log'
  }
  return `${log.level} log`
}

function getEventDescription(log: MizuLog) {
  if (isMizuFetchStartMessage(log?.message)) {
    return `${log.message.method} ${log.message.url}`
  }
  if (isMizuFetchErrorMessage(log?.message)) {
    return `\t${log.message.url}`
  }
  if (isMizuFetchEndMessage(log?.message)) {
    return `\t${log.message.url}`
  }
  if (isMizuErrorMessage(log?.message)) {
    return log.message.message
  }
  return String(log?.message?.message ?? log?.message);
}