import { WorkerEntrypoint } from "cloudflare:workers";

export class WoofWorker extends WorkerEntrypoint {
  async bark(options: { volume: number }): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (options.volume > 5) {
      return "WOOF";
    }

    return "woof";
  }

  // From Cloudflare docs: "Currently, entrypoints without a named handler are not supported"
  // TODO - Check if this is still the case that we need a fetch handler?
  async fetch() {
    return new Response(null, { status: 404 });
  }
}

export default WoofWorker;
