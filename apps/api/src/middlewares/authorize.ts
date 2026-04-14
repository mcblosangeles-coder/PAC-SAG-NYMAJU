import type { NextFunction, Request, Response } from "express";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";
import { permissionsService } from "../modules/rbac/permissions.service";
import type { AuthContext } from "./authenticate";
import { scopePolicy } from "../modules/rbac/scope.policy";

const getAuthContext = (res: Response): AuthContext | null => {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth) return null;
  if (typeof auth.userId !== "string" || auth.userId.trim().length === 0) return null;
  return auth;
};

export const authorize =
  (
    requiredPermission: string,
    options?: {
      resource?: "expediente";
      getResourceId?: (req: Request) => string | null;
    }
  ) =>
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    const req = _req;
    const auth = getAuthContext(res);
    if (!auth) {
      sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "No autenticado.");
      return;
    }

    const hasPermission = await permissionsService.hasPermission(auth.userId, requiredPermission);
    if (!hasPermission) {
      sendApiError(res, 403, API_ERROR_CODE.forbidden, "No autorizado.", { requiredPermission });
      return;
    }

    const securityContext = await permissionsService.getUserSecurityContext(auth.userId);
    const roles = securityContext?.roles ?? auth.roles;
    const scope = scopePolicy.resolveScopeForPermission(roles, requiredPermission);

    if (scope === "none") {
      sendApiError(res, 403, API_ERROR_CODE.forbidden, "No autorizado por alcance.", {
        requiredPermission
      });
      return;
    }

    if (options?.resource === "expediente") {
      const expedienteId = options.getResourceId?.(req) ?? null;
      if (!expedienteId) {
        sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Expediente invalido.");
        return;
      }

      const canAccess = await scopePolicy.evaluateExpedienteAccess({
        userId: auth.userId,
        scope,
        expedienteId
      });

      if (!canAccess) {
        sendApiError(res, 403, API_ERROR_CODE.forbidden, "No autorizado por alcance.", {
          requiredPermission,
          scope
        });
        return;
      }
    }

    next();
  };
