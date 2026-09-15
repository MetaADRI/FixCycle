import type { ApiEnvelope } from './envelope';

export type ErrorCode =
  | 'ENVELOPE_INVALID'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'RESULT_FAILURE'
  | 'RESULT_PENDING'
  | 'UNAUTHORIZED';

export interface ApiErrorOptions {
  code: ErrorCode;
  message: string;
  status?: number;
  envelope?: ApiEnvelope<unknown>;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly envelope?: ApiEnvelope<unknown>;

  constructor(options: ApiErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.envelope = options.envelope;
  }
}

export class EnvelopeInvalidError extends ApiError {
  constructor(message: string, cause?: unknown) {
    super({ code: 'ENVELOPE_INVALID', message, cause });
    this.name = 'EnvelopeInvalidError';
  }
}

export class HttpStatusError extends ApiError {
  constructor(status: number, message: string, envelope?: ApiEnvelope<unknown>) {
    super({ code: 'HTTP_ERROR', message, status, envelope });
    this.name = 'HttpStatusError';
  }
}

export class UnauthorizedError extends HttpStatusError {
  constructor(message = 'Session expired') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, cause?: unknown) {
    super({ code: 'NETWORK_ERROR', message, cause });
    this.name = 'NetworkError';
  }
}

// The API commonly returns HTTP 200 with result:"0" as the failure mode.
export class ResultFailureError extends ApiError {
  constructor(message: string, envelope: ApiEnvelope<unknown>) {
    super({ code: 'RESULT_FAILURE', message, envelope });
    this.name = 'ResultFailureError';
  }
}

export class ResultPendingError extends ApiError {
  constructor(message: string, envelope: ApiEnvelope<unknown>) {
    super({ code: 'RESULT_PENDING', message, envelope });
    this.name = 'ResultPendingError';
  }
}