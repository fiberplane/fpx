import { CF_BINDING_TYPE } from "@/constants";
import type { MizuOrphanLog, OtelSpan } from "@/queries";
import { z } from "zod";
import { getRequestBody, getRequestUrl, getString } from "./otel-helpers";

export type Waterfall = Array<SpanWithVendorInfo | MizuOrphanLog>;

export type SpanWithVendorInfo = {
  span: OtelSpan;
  vendorInfo: ReturnType<typeof getVendorInfo>;
};

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

const CloudflareD1VendorInfoSchema = z.object({
  vendor: z.literal("cloudflare"),
  type: z.literal("d1"),
  sql: z.object({
    query: z.string(),
    params: z.array(z.string()),
  }),
});

export type CloudflareD1VendorInfo = z.infer<
  typeof CloudflareD1VendorInfoSchema
>;

const CloudflareR2VendorInfoSchema = z.object({
  vendor: z.literal("cloudflare"),
  type: z.literal("r2"),
});

const CloudflareAiVendorInfoSchema = z.object({
  vendor: z.literal("cloudflare"),
  type: z.literal("ai"),
});

const CloudflareKVVendorInfoSchema = z.object({
  vendor: z.literal("cloudflare"),
  type: z.literal("kv"),
});

const CloudflareVendorInfoSchema = z.discriminatedUnion("type", [
  CloudflareD1VendorInfoSchema,
  CloudflareR2VendorInfoSchema,
  CloudflareAiVendorInfoSchema,
  CloudflareKVVendorInfoSchema,
]);

export type CloudflareVendorInfo = z.infer<typeof CloudflareVendorInfoSchema>;

const VendorInfoSchema = z.union([
  NeonVendorInfoSchema,
  OpenAIVendorInfoSchema,
  AnthropicVendorInfoSchema,
  CloudflareVendorInfoSchema,
  NoneVendorInfoSchema,
]);

export type VendorInfo = z.infer<typeof VendorInfoSchema>;

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

export const isCloudflareD1VendorInfo = (
  vendorInfo: VendorInfo,
): vendorInfo is CloudflareD1VendorInfo => {
  return vendorInfo.vendor === "cloudflare" && vendorInfo.type === "d1";
};

export const isCloudflareVendorInfo = (
  vendorInfo: VendorInfo,
): vendorInfo is CloudflareVendorInfo => {
  return vendorInfo.vendor === "cloudflare";
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

  if (isCloudflareD1Span(span)) {
    return { vendor: "cloudflare", type: "d1", sql: getD1SqlQuery(span) };
  }

  if (isCloudflareR2Span(span)) {
    return { vendor: "cloudflare", type: "r2" };
  }

  if (isCloudflareAiSpan(span)) {
    return { vendor: "cloudflare", type: "ai" };
  }

  if (isCloudflareKVSpan(span)) {
    return { vendor: "cloudflare", type: "kv" };
  }

  return { vendor: "none" };
}

const isCloudflareD1Span = (span: OtelSpan) => {
  return getString(span.attributes[CF_BINDING_TYPE]) === "D1Database";
};

const isCloudflareR2Span = (span: OtelSpan) => {
  return getString(span.attributes[CF_BINDING_TYPE]) === "R2Bucket";
};

const isCloudflareKVSpan = (span: OtelSpan) => {
  return getString(span.attributes[CF_BINDING_TYPE]) === "KvNamespace";
};

const isCloudflareAiSpan = (span: OtelSpan) => {
  return getString(span.attributes[CF_BINDING_TYPE]) === "Ai";
};

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

function getD1SqlQuery(span: OtelSpan) {
  const queryArgs = getString(span?.attributes?.args);
  try {
    const argsArray = JSON.parse(queryArgs);
    const query = argsArray?.[1];
    const params = argsArray?.[2];
    return {
      query,
      params,
    };
  } catch (e) {
    return { query: "DB QUERY", params: [] };
  }
}
