import { isAnthropicVendorInfo, isNeonVendorInfo, isOpenAIVendorInfo, VendorInfo } from "@/utils";
import { useMemo } from "react";
import { format } from "sql-formatter";
import { NeonSection } from "./NeonSection";

export function useFormattedNeonQuery(
  sql: {
    query: string;
    params?: string[];
  },
  options?: {
    tabWidth?: number;
  },
) {
  return useMemo(() => {
    try {
      const paramsFromNeon = sql.params ?? [];
      // NOTE - sql-formatter expects the index in the array to match the `$nr` syntax from postgres
      //        this makes the 0th index unused, but it makes the rest of the indices match the `$1`, `$2`, etc.
      const params = ["", ...paramsFromNeon];
      return format(sql.query, {
        language: "postgresql",
        params,
        tabWidth: options?.tabWidth ?? 2,
      });
    } catch (_e) {
      // Being very defensive soz
      return sql?.query ?? "";
    }
  }, [sql, options?.tabWidth]);
}


const DEFAULT_VENDOR_RESULT = {
  component: undefined,
  title: undefined,
};



/**
 * Returns a component and title for a vendor-specific span.
 * @param span The span to render.
 * @returns A component and title for a vendor-specific section of the span.
 */
export function useVendorSpecificSection(vendorInfo: VendorInfo) {
  return useMemo(() => {
    // const vendorInfo =
    if (isNeonVendorInfo(vendorInfo)) {
      return {
        component: <NeonSection vendorInfo={vendorInfo} />,
        title: "Neon Database Call",
      };
    }
    if (isOpenAIVendorInfo(vendorInfo)) {
      return {
        component: undefined,
        title: "OpenAI API Call",
      };
    }
    if (isAnthropicVendorInfo(vendorInfo)) {
      return {
        component: undefined,
        title: "Anthropic API Call",
      };
    }
    return DEFAULT_VENDOR_RESULT;
  }, [vendorInfo]);
}
