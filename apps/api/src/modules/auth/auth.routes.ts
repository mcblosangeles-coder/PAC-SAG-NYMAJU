import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../lib/env";
import { API_ERROR_CODE, sendApiError } from "../../lib/api-error";
import { authService, AuthError } from "./auth.service";
import type { JwtTokenPayload } from "./auth.types";

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const bodyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const authRouter: Router = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const email = bodyString(req.body?.email);
    const password = bodyString(req.body?.password);
    if (!email || !password) {
      return sendApiError(res, 400, API_ERROR_CODE.invalidPayload, "Payload invalido.");
    }

    const result = await authService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: bodyString(req.header("user-agent") ?? "")
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return sendApiError(res, error.statusCode, API_ERROR_CODE.unauthenticated, error.message);
    }
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "Error interno en login.");
  }
});

authRouter.post("/refresh", async (req, res) => {
  try {
    const refreshToken = bodyString(req.body?.refreshToken);
    if (!refreshToken) {
      return sendApiError(res, 400, API_ERROR_CODE.invalidPayload, "Payload invalido.");
    }

    const tokens = await authService.refresh({
      refreshToken,
      ipAddress: req.ip,
      userAgent: bodyString(req.header("user-agent") ?? "")
    });
    return res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof AuthError) {
      return sendApiError(res, error.statusCode, API_ERROR_CODE.unauthenticated, error.message);
    }
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "Error interno en refresh.");
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const refreshToken = bodyString(req.body?.refreshToken);
    await authService.logout({
      refreshToken,
      ipAddress: req.ip
    });
    return res.status(204).send();
  } catch (error) {
    if (error instanceof AuthError) {
      return sendApiError(res, error.statusCode, API_ERROR_CODE.unauthenticated, error.message);
    }
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "Error interno en logout.");
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const token = getBearerToken(req.header("authorization"));
    if (!token) {
      return sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "Token no provisto.");
    }

    const decoded = jwt.verify(token, env.jwtAccessSecret);
    if (!decoded || typeof decoded !== "object") {
      return sendApiError(
        res,
        401,
        API_ERROR_CODE.unauthenticated,
        "Token invalido o expirado."
      );
    }

    const payload = decoded as Partial<JwtTokenPayload>;
    if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
      return sendApiError(
        res,
        401,
        API_ERROR_CODE.unauthenticated,
        "Token invalido o expirado."
      );
    }

    const user = await authService.me(payload.sub.trim());
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      return sendApiError(res, error.statusCode, API_ERROR_CODE.unauthenticated, error.message);
    }
    return sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "Token invalido o expirado.");
  }
});
