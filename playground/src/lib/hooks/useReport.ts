import { useMutation } from "@tanstack/react-query";
import { api } from "../api";

export function useCreateReport() {
  return useMutation({
    mutationFn: api.createReport,
  });
} 