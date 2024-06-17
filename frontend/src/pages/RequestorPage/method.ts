export function getHttpMethodTextColor(method: string) {
  return {
    GET: "text-green-500",
    POST: "text-yellow-500",
    PUT: "text-orange-500",
    PATCH: "text-orange-500",
    DELETE: "text-red-500",
    OPTIONS: "text-blue-300",
    HEAD: "text-gray-600",
  }[method];
}
