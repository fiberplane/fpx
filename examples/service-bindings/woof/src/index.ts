import { WorkerEntrypoint } from "cloudflare:workers";

export class WoofWorker extends WorkerEntrypoint {
  async bark(): Promise<string> {
    return "woof";
  }

  // From Cloudflare docs: "Currently, entrypoints without a named handler are not supported"
  // TODO - Check if this is still the case that we need a fetch handler?
  async fetch() {
    return new Response(null, { status: 404 });
  }
}

export default WoofWorker;
