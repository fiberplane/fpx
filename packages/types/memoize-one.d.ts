declare module "memoize-one" {
  // biome-ignore lint/suspicious/noExplicitAny: allow override
  export default function memoizeOne<T extends (...args: any[]) => any>(
    resultFn: T,
    isEqual?: (newArgs: Parameters<T>, lastArgs: Parameters<T>) => boolean,
  ): T;
}
