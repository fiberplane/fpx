import { createFiberplane } from "./middleware.js";

// Export the main function
export { createFiberplane };

/**
 * @deprecated Use createFiberplane() instead. This alias will be removed in a future version.
 */
export const createMiddleware = createFiberplane;

export { FpService } from "./services/index.js";
