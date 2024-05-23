import { format, formatDistanceToNow, formatRFC7231 } from "date-fns";

export function formatDate(d: Date | string) {
  return format(new Date(d), "HH:mm:ss.SSS");
}

export function humanReadableDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function rfc7231Date(dateString: string) {
  return formatRFC7231(new Date(dateString));
}
