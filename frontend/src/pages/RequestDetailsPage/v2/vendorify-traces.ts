import { MizuFetchSpan, MizuSpan, OtelSpan, isMizuFetchSpan } from "@/queries";
import { z } from "zod";
import { getRequestBody, getRequestUrl } from "./otel-helpers";

const NoneVendorInfoSchema = z.object({
  vendor: z.literal("none"),
});

const NeonVendorInfoSchema = z.object({
  vendor: z.literal("neon"),
  sql: z.object({
    query: z.string(),
    params: z.array(z.string()),
  }),
});

export type NeonVendorInfo = z.infer<typeof NeonVendorInfoSchema>;

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
  NoneVendorInfoSchema,
]);

export type VendorInfo = z.infer<typeof VendorInfoSchema>;

type VendorifiedSpan = MizuFetchSpan & {
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

export const isNeonVendorInfo = (
  vendorInfo: VendorInfo,
): vendorInfo is NeonVendorInfo => {
  return vendorInfo.vendor === "neon";
};

export const isOpenAIVendorInfo = (
  vendorInfo: VendorInfo,
): vendorInfo is OpenAIVendorInfo => {
  return vendorInfo.vendor === "openai";
};

export const isAnthropicVendorInfo = (
  vendorInfo: VendorInfo,
): vendorInfo is AnthropicVendorInfo => {
  return vendorInfo.vendor === "anthropic";
};

export function getVendorInfo(span: OtelSpan): VendorInfo {
  if (isOpenAIFetch(span)) {
    return { vendor: "openai" };
  }

  if (isNeonFetch(span)) {
    return {
      vendor: "neon",
      sql: getNeonSqlQuery(span),
    };
  }

  if (isAnthropicFetch(span)) {
    return { vendor: "anthropic" };
  }

  return { vendor: "none" };
}

const isOpenAIFetch = (span: OtelSpan) => {
  const requestUrl = getRequestUrl(span);
  try {
    const url = new URL(requestUrl);
    return url.hostname.includes("api.openai.com");
  } catch (e) {
    return false;
  }
};

// TODO - Make this a bit more robust?
const isNeonFetch = (span: OtelSpan) => {
  return !!span.attributes["http.request.header.neon-connection-string"];
};

const isAnthropicFetch = (span: OtelSpan) => {
  const requestUrl = getRequestUrl(span);
  try {
    const url = new URL(requestUrl);
    return url.hostname.includes("api.anthropic.com");
  } catch (e) {
    return false;
  }
};

function getNeonSqlQuery(span: OtelSpan) {
  const body = getRequestBody(span);
  // const body = getString(span.attributes["fpx.request.body"]);
  if (!body) {
    return { query: "DB QUERY", params: [] };
  }
  try {
    // TODO - Merge query with the params somehow
    const json = JSON.parse(body);
    return {
      query: json.query as string,
      params: json.params as Array<string>,
    };
  } catch (e) {
    return { query: "DB QUERY", params: [] };
  }
}
