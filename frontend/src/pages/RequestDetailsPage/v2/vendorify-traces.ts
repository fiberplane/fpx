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

const NoVendorInfoSchema = z.object({
  vendor: z.literal("none"),
});

const NeonVendorInfoSchema = z.object({
  vendor: z.literal("neon"),
  sql: z.string(),
});

type NeonVendorInfo = z.infer<typeof NeonVendorInfoSchema>;

const OpenAIVendorInfoSchema = z.object({
  vendor: z.literal("openai"),
});

type OpenAIVendorInfo = z.infer<typeof OpenAIVendorInfoSchema>;

const AnthropicVendorInfoSchema = z.object({
  vendor: z.literal("anthropic"),
});

type AnthropicVendorInfo = z.infer<typeof AnthropicVendorInfoSchema>;

const VendorInfoSchema = z.union([
  NeonVendorInfoSchema,
  OpenAIVendorInfoSchema,
  AnthropicVendorInfoSchema,
  NoVendorInfoSchema,
]);

type VendorInfo = z.infer<typeof VendorInfoSchema>;

type VendorifiedSpan = MizuFetchSpan & {
  vendorInfo: VendorInfo;
};

export type NeonSpan = Omit<VendorifiedSpan, "vendorInfo"> & {
  vendorInfo: NeonVendorInfo;
};

type OpenAISpan = Omit<VendorifiedSpan, "vendorInfo"> & {
  vendorInfo: OpenAIVendorInfo;
};

type AnthropicSpan = Omit<VendorifiedSpan, "vendorInfo"> & {
  vendorInfo: AnthropicVendorInfo;
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

export const isNeonSpan = (span: unknown): span is NeonSpan => {
  return isVendorifiedSpan(span) && span.vendorInfo.vendor === "neon";
};

export const isOpenAISpan = (span: unknown): span is OpenAISpan => {
  return isVendorifiedSpan(span) && span.vendorInfo.vendor === "openai";
};

export const isAnthropicSpan = (span: unknown): span is AnthropicSpan => {
  return isVendorifiedSpan(span) && span.vendorInfo.vendor === "anthropic";
};

export const vendorifySpan = (span: MizuFetchSpan): VendorifiedSpan => {
  if (isOpenAIFetch(span)) {
    return { ...span, vendorInfo: { vendor: "openai" } };
  }
  if (isNeonFetch(span)) {
    return {
      ...span,
      vendorInfo: {
        vendor: "neon",
        sql: getNeonSqlQuery(span),
      },
    };
  }
  if (isAnthropicFetch(span)) {
    return { ...span, vendorInfo: { vendor: "anthropic" } };
  }

  return { ...span, vendorInfo: { vendor: "none" } };
};

const isOpenAIFetch = (span: MizuFetchSpan) => {
  const requestUrl = span.attributes["server.address"];
  if (typeof requestUrl !== "string") {
    return false;
  }
  return requestUrl.includes("api.openai.com");
};

// TODO - Make this a bit more robust?
const isNeonFetch = (span: MizuFetchSpan) => {
  return !!span.attributes["http.request.header.neon-connection-string"];
};

const isAnthropicFetch = (span: MizuFetchSpan) => {
  const requestUrl = span.attributes["server.address"];
  if (typeof requestUrl !== "string") {
    return false;
  }
  return requestUrl.includes("api.anthropic.com");
};

function getNeonSqlQuery(span: MizuFetchSpan) {
  const body = span.attributes["fpx.request.body"] as string;
  if (!body) {
    return "DB QUERY";
  }
  try {
    // TODO - Merge query with the params somehow
    const json = JSON.parse(body);
    return json.query;
  } catch (e) {
    return "DB QUERY";
  }
}
