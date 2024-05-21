import { z } from 'zod';

const Lifecycle = z.enum(["request", "response", "db-error", "mock"]);
const LogLevel = z.enum(["info", "warning", "error"]);

const RequestLog = z.object({
  id: z.number(),
  level: LogLevel,
  message: z.object({
    method: z.string(),
    lifecycle: Lifecycle,
    path: z.string(),
  }),
  createdAt: z.string(),
});

const ResponseLog = z.object({
  id: z.number(),
  level: LogLevel,
  message: z.object({
    method: z.string(),
    lifecycle: Lifecycle,
    path: z.string(),
    route: z.string(),
    handler: z.string(),
    status: z.string(),
    elapsed: z.number(),
  }),
  createdAt: z.string(),
});

const DbErrorLog = z.object({
  id: z.number(),
  level: LogLevel,
  message: z.string(),
  createdAt: z.string(),
});

export { RequestLog, ResponseLog, DbErrorLog };