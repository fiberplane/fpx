const iconColorMap: Record<string, string> = {
  error: "bg-destructive/90",
  warn: "bg-warning/80",
  info: "bg-primary/80",
  debug: "bg-success/80",
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
