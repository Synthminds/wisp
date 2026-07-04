/**
 * Structured errors: user- and webhook-facing responses expose a stable
 * `{ code, message }` and NOTHING else — no stack traces, SQL, or provider
 * errors. Log the internal detail server-side; return the safe shape.
 */
export interface AppErrorShape {
  code: string;
  message: string;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  /** Internal-only context; never serialized to a client. */
  readonly detail?: unknown;

  constructor(code: string, message: string, status = 400, detail?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }

  toResponseBody(): AppErrorShape {
    return { code: this.code, message: this.message };
  }
}

/** Known codes, kept in one place so channels/handlers stay consistent. */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PACT_SELF_ONLY: "PACT_SELF_ONLY",
  WEBHOOK_UNVERIFIED: "WEBHOOK_UNVERIFIED",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Coerce anything thrown into a safe response body + status. */
export function toSafeError(err: unknown): { status: number; body: AppErrorShape } {
  if (err instanceof AppError) {
    return { status: err.status, body: err.toResponseBody() };
  }
  return {
    status: 500,
    body: { code: ErrorCodes.INTERNAL, message: "Internal error." },
  };
}
