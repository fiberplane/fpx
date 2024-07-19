type GlobalFetch = typeof globalThis.fetch;
type GlobalFetchArgs = Parameters<GlobalFetch>;
export type GlobalResponse = Awaited<ReturnType<GlobalFetch>>;
export type InputParam = GlobalFetchArgs[0];
export type InitParam = GlobalFetchArgs[1];
