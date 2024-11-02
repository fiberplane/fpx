import { DurableObject } from "cloudflare:workers";
import type { Context } from "hono";
import { type SSEStreamingApi, streamSSE } from "hono/streaming";
import { modifiedStreamSSE } from "./streaming-help";
import type { Bindings, HatchApp } from "./types";

export class GooseEgg extends DurableObject<Bindings> {
  // @ts-expect-error - Typescript does not understand the guarantees we get with ctx.blockConcurrencyWhile()
  status: string;
  clients: Set<SSEStreamingApi>;

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    this.clients = new Set();

    // `blockConcurrencyWhile()` ensures no requests are delivered until
    // initialization completes.
    ctx.blockConcurrencyWhile(async () => {
      // After initialization, future reads do not need to access storage.
      this.status = (await ctx.storage.get("status")) || "initializing";

      // TODO - When the status is `finished` or `failed`, close all streams
    });
  }

  async handleSSE(c: Context<HatchApp>) {
    return streamSSE(
      c,
      async (stream) => {
        // this.clients.add(stream);

        // TODO - When the status is `finished` or `failed`, report the status and close the stream

        // This *should* be called when the client disconnects
        stream.onAbort(() => {
          this.clients.delete(stream);
        });

        // NOTE - Could do interval polling here, might be simpler than pushing updates when status is updated
        //
        // while (true) {
        //   const currentStatus = this.status;
        //   await stream.writeSSE({
        //     data: currentStatus,
        //     event: 'status-update',
        //     id: crypto.randomUUID(),
        //   })
        //   await stream.sleep(1000)
        // }
      },
      async (_e, stream) => {
        console.error("Error streaming SSE:", _e?.message);
        this.clients.delete(stream);
      },
    );
  }

  async fetch(request: Request) {
    return modifiedStreamSSE(
      request,
      async (stream) => {
        this.clients.add(stream);

        // TODO - When the status is `finished` or `failed`, report the status and close the stream

        // This *should* be called when the client disconnects
        stream.onAbort(() => {
          this.clients.delete(stream);
        });

        stream.writeSSE({
          event: "status-update",
          data: "Hello, world!",
          id: crypto.randomUUID(),
        });

        await stream.sleep(1000);

        // NOTE - Could do interval polling here, might be simpler than pushing updates when status is updated
        //
        while (
          !stream.aborted &&
          !stream.closed &&
          this.status !== "finished" &&
          this.status !== "failed"
        ) {
          const currentStatus = this.status;
          await stream.writeSSE({
            data: currentStatus,
            event: "status-update",
            id: crypto.randomUUID(),
          });
          await stream.sleep(2000);
        }
      },
      async (_e, stream) => {
        console.error("Error streaming SSE:", _e?.message);
        this.clients.delete(stream);
      },
    );
  }

  async getStatus() {
    return this.status;
  }

  /**
   * Set the status and notify all clients
   *
   * This feels ripe for race conditions
   *
   * @param status
   */
  async setStatus(status: string) {
    this.status = status;

    await this.ctx.storage.put("status", status);

    for (const client of this.clients) {
      const currentStatus = this.status;
      // If the status has changed since this setter was invoked, break the loop.
      if (currentStatus !== status) {
        break;
      }
      try {
        await client.writeSSE({
          data: currentStatus,
          event: "status-update",
          id: crypto.randomUUID(),
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Error writing SSE:", errorMessage);
        this.clients.delete(client);
      }
    }

    // TODO - When the status is `finished` or `failed`, close the stream
  }

  // The only way to remove all storage is to call deleteAll().
  // Calling deleteAll() ensures that a Durable Object will not be billed for storage.
  async clear() {
    await this.ctx.storage.deleteAll();
  }
}
