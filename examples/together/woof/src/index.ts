import { WorkerEntrypoint } from "cloudflare:workers";

export default class MeowWorker extends WorkerEntrypoint {
  async add(a: number, b: number): Promise<number> {
    return a + b;
  }
}
