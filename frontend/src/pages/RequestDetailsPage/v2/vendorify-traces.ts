import {
  MizuFetchSpan,
  MizuOrphanLog,
  MizuSpan,
  MizuTraceV2,
  isMizuFetchSpan,
} from "@/queries";
import { z } from "zod";

export type VendorifiedTrace = MizuTraceV2 & {
  waterfall: (VendorifiedSpan | MizuSpan | MizuOrphanLog)[];
};

export const vendorifyTrace = (trace: MizuTraceV2): VendorifiedTrace => {
  const vendorifiedWaterfall = trace.waterfall.map((spanOrLog) => {
    if (isMizuFetchSpan(spanOrLog)) {
      return vendorifySpan(spanOrLog);
    }
    return spanOrLog;
  });
  return {
    ...trace,
    waterfall: vendorifiedWaterfall,
  };
};

export const NEON_EXAMPLE = {
  vendorInfo: {
    vendor: "neon",
  },
} as const;

export const OPENAI_EXAMPLE = {
  vendorInfo: {
    vendor: "openai",
  },
} as const;

const NoVendorInfoSchema = z.object({
  vendor: z.literal("none"),
});

const NeonVendorInfoSchema = z.object({
  vendor: z.literal("neon"),
});

const OpenAIVendorInfoSchema = z.object({
  vendor: z.literal("openai"),
});

const AnthropicVendorInfoSchema = z.object({
  vendor: z.literal("anthropic"),
});

const VendorInfoSchema = z.union([
  NeonVendorInfoSchema,
  OpenAIVendorInfoSchema,
  AnthropicVendorInfoSchema,
  NoVendorInfoSchema,
]);

type VendorInfo = z.infer<typeof VendorInfoSchema>;

export type VendorifiedSpan = MizuFetchSpan & {
  vendorInfo: VendorInfo;
};

const hasVendorInfo = (span: MizuSpan): span is VendorifiedSpan => {
  return VendorInfoSchema.safeParse(span.vendorInfo).success;
};

export const canRenderVendorInfo = (
  span: MizuFetchSpan,
): span is VendorifiedSpan => {
  return hasVendorInfo(span) && span.vendorInfo.vendor !== "none";
};

export const isVendorifiedSpan = (span: unknown): span is VendorifiedSpan => {
  if (!isMizuFetchSpan(span)) {
    return false;
  }
  return hasVendorInfo(span);
};

export const vendorifySpan = (span: MizuFetchSpan): VendorifiedSpan => {
  if (isOpenAIFetch(span)) {
    return { ...span, vendorInfo: { vendor: "openai" } };
  }
  if (isNeonFetch(span)) {
    return { ...span, vendorInfo: { vendor: "neon" } };
  }
  if (isAnthropicFetch(span)) {
    return { ...span, vendorInfo: { vendor: "anthropic" } };
  }

  return { ...span, vendorInfo: { vendor: "none" } };
};

const isOpenAIFetch = (span: MizuFetchSpan) => {
  return false;
};

// TODO - Make this a bit more robust?
const isNeonFetch = (span: MizuFetchSpan) => {
  console.log("spannnn", span.attributes);
  return !!span.attributes["http.request.header.neon-connection-string"];
};

const isAnthropicFetch = (span: MizuFetchSpan) => {
  return false;
};
