import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { OAISchema, ApiResponse } from "@/types";

export const SCHEMAS_KEY = "schemas";

export const schemasQueryOptions = () => ({
  queryKey: [SCHEMAS_KEY],
  queryFn: () => api.getSchemas(),
  select: (data: ApiResponse<OAISchema[]>) => data.data,
});

export function useSchemas() {
  return useQuery(schemasQueryOptions());
}

export const schemaQueryOptions = (id: string) => ({
  queryKey: [SCHEMAS_KEY, id],
  queryFn: () => api.getSchema(id),
  select: (data: ApiResponse<OAISchema>) => data.data,
  enabled: !!id,
});

export function useSchema(id: string) {
  return useQuery(schemaQueryOptions(id));
} 