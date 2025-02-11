// NOTE - Copy-pasted from fp-services/src/constants.ts
export const ERROR_TYPE_UNAUTHORIZED = "UnauthorizedError";
export const ERROR_TYPE_NOT_FOUND = "NotFoundError";
export const ERROR_TYPE_INVALID_TOKEN = "InvalidTokenError";
export const ERROR_TYPE_TOKEN_EXPIRED = "TokenExpiredError";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = ERROR_TYPE_UNAUTHORIZED;
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = ERROR_TYPE_NOT_FOUND;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class InvalidTokenError extends Error {
  constructor(message = "Invalid Token") {
    super(message);
    this.name = ERROR_TYPE_INVALID_TOKEN;
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

export class TokenExpiredError extends Error {
  constructor(message = "Token Expired") {
    super(message);
    this.name = ERROR_TYPE_TOKEN_EXPIRED;
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}
