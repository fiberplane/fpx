import type { Context } from "hono";

// inversion of control container to store parked requests
export type ParkingLot = Map<
  string,
  [Context, (value: Response) => void, (reason: unknown) => void]
>;

export const parkingLot: ParkingLot = new Map();

export { deflectorMiddleware } from "./middleware.js";
