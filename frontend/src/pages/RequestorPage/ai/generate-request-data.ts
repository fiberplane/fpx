import { useQuery } from "react-query";
import { ProbedRoute, Requestornator } from "../queries";

const fetchAiRequestData = (
  route: ProbedRoute | null,
  history: Array<Requestornator>,
  persona: string,
) => {
  // FIXME - type wonkiness
  const { handler, method, path } = route ?? {};
  const simplifiedHistory = history.map((h) =>
    [
      `[Request]`,
      `${h.app_requests.requestMethod} ${h.app_requests.requestUrl}`,
      `[Response]`,
      `Status: ${h.app_responses.responseStatusCode}`,
      `Body: ${h.app_responses.responseBody}`,
    ].join("\n***\n"),
  );
  return fetch("/v0/generate-request", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      handler,
      method,
      path,
      history: simplifiedHistory,
      persona,
    }),
  }).then(async (r) => {
    if (!r.ok) {
      const payload = await r.json().catch(() => null);
      throw new Error(payload?.message || "Failed to generate request data");
    }
    return r.json();
  });
};

export function useAiRequestData(
  route: ProbedRoute | null,
  history: Array<Requestornator>,
  persona = "Friendly",
) {
  return useQuery({
    queryKey: ["generateRequest"],
    queryFn: () => fetchAiRequestData(route, history, persona),
    enabled: false,
    retry: false,
  });
}
