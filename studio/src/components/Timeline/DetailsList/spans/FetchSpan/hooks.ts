import { useMemo } from "react";
import { format } from "sql-formatter";

export function useFormattedNeonQuery(sql: {
  query: string;
  params?: string[];
}) {
  return useMemo(() => {
    try {
      const paramsFromNeon = sql.params ?? [];
      // NOTE - sql-formatter expects the index in the array to match the `$nr` syntax from postgres
      //        this makes the 0th index unused, but it makes the rest of the indices match the `$1`, `$2`, etc.
      const params = ["", ...paramsFromNeon];
      return format(sql.query, {
        language: "postgresql",
        params,
      });
    } catch (_e) {
      // Being very defensive soz
      return sql?.query ?? "";
    }
  }, [sql]);
}
