const iconColorMap: Record<string, string> = {
  error: "bg-red-500",
  warn: "bg-yellow-500",
  info: "bg-blue-500",
  debug: "bg-green-500",
};

export function getIconColor(level: string) {
  return iconColorMap[level] || "bg-gray-500";
}

export function formatTimestamp(timestamp: Date) {
  return `${timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}.${timestamp.getMilliseconds().toString().padStart(3, "0")}`;
}
