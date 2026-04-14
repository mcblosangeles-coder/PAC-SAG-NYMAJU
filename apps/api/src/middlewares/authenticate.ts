import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";
import { env } from "../lib/env";
import type { JwtTokenPayload } from "../modules/auth/auth.types";

export type AuthContext = {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
};

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const toAuthContext = (decoded: unknown): AuthContext | null => {
  if (!decoded || typeof decoded !== "object") return null;
  const payload = decoded as Partial<JwtTokenPayload>;

  if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) return null;
  if (typeof payload.email !== "string" || payload.email.trim().length === 0) return null;
  if (
    !Array.isArray(payload.roles) ||
    !payload.roles.every((r: unknown) => typeof r === "string")
  ) {
    return null;
  }
  if (
    !Array.isArray(payload.permissions) ||
    !payload.permissions.every((p: unknown) => typeof p === "string")
  ) {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
    roles: payload.roles,
    permissions: payload.permissions
  };
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = getBearerToken(req.header("authorization"));
    if (!token) {
      sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "Token no provisto.");
      return;
    }

    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const auth = toAuthContext(decoded);
    if (!auth) {
      sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "Token invalido o expirado.");
      return;
    }

    res.locals.auth = auth;
    next();
  } catch {
    sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "Token invalido o expirado.");
  }
};
