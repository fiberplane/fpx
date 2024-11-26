import { WorkerEntrypoint } from "cloudflare:workers";

export default class WoofWorker extends WorkerEntrypoint {
  async add(a: number, b: number): Promise<number> {
    return a + b;
  }
  
  // From Cloudflare docs: "Currently, entrypoints without a named handler are not supported"
  // TODO - Check if this is still the case that we need a fetch handler?
  async fetch() { return new Response(null, { status: 404 }); }
}
