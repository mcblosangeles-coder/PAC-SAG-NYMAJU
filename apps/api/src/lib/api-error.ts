import type { Response } from "express";

export const API_ERROR_CODE = {
  invalidParam: "INVALID_PARAM",
  invalidPayload: "INVALID_PAYLOAD",
  unauthenticated: "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
  rateLimited: "RATE_LIMITED",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  unprocessableEntity: "UNPROCESSABLE_ENTITY",
  internalError: "INTERNAL_ERROR"
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

export const sendApiError = (
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>
) => res.status(status).json({ code, message, ...(extra ?? {}) });
