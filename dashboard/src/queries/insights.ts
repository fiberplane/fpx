import { useQuery } from "@tanstack/react-query";

export type InsightsOverviewResponse = {
  totalRequest: number;
  failedRequest: number;
  requests: Array<DataPoint>;
};

export type DataPoint = {
  timestamp: Date;
  totalRequests: number;
  failedRequests: number;
};

const INSIGHTS_OVERVIEW_KEY = "insightsOverview";

export function useFetchInsightsOverview() {
  return useQuery({
    queryKey: [INSIGHTS_OVERVIEW_KEY],
    queryFn: async (): Promise<InsightsOverviewResponse> => {
      const response = await fetch("/v1/insights");
      const json = (await response.json()) as InsightsOverviewResponse;

      return json;
    },
  });
}
