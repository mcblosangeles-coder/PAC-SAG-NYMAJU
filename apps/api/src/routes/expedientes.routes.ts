import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import type { AuthContext } from "../middlewares/authenticate";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";
import {
  expedientesService,
  ExpedienteServiceError
} from "../modules/expedientes/expedientes.service";
import { mapExpedienteServiceStatusToErrorCode } from "../modules/expedientes/error-mapping";
import { workflowService } from "../modules/expedientes/workflow.service";

export const expedientesRouter: Router = Router();

expedientesRouter.use(authenticate);

const paramToString = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
};

const bodyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const queryToPositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
  { min = 1, max = 100 }: { min?: number; max?: number } = {}
): number | null => {
  if (typeof value === "undefined") return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) return null;
  return parsed;
};

const queryToScope = (value: string | string[] | undefined): "all" | "global" | "stage" | null => {
  if (typeof value === "undefined") return "all";
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  if (raw === "all" || raw === "global" || raw === "stage") return raw;
  return null;
};

expedientesRouter.get(
  "/:id/history",
  authorize("workflow.read", {
    resource: "expediente",
    getResourceId: (req) => paramToString(req.params.id)
  }),
  async (req, res) => {
    try {
      const expedienteId = paramToString(req.params.id);
      const page = queryToPositiveInt(req.query.page as string | string[] | undefined, 1);
      const pageSize = queryToPositiveInt(req.query.pageSize as string | string[] | undefined, 20);
      const scope = queryToScope(req.query.scope as string | string[] | undefined);

      if (!expedienteId) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Expediente invalido.");
      }
      if (!page || !pageSize || !scope) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Parametros de consulta invalidos.");
      }

      const history = await expedientesService.getStateHistory({
        expedienteId,
        page,
        pageSize,
        scope
      });
      return res.status(200).json(history);
    } catch (error) {
      if (error instanceof ExpedienteServiceError) {
        return sendApiError(
          res,
          error.statusCode,
          mapExpedienteServiceStatusToErrorCode(error.statusCode),
          error.message
        );
      }
      return sendApiError(
        res,
        500,
        API_ERROR_CODE.internalError,
        "No fue posible obtener historial de estado del expediente."
      );
    }
  }
);

expedientesRouter.get(
  "/:id",
  authorize("workflow.read", {
    resource: "expediente",
    getResourceId: (req) => paramToString(req.params.id)
  }),
  async (req, res) => {
    try {
      const expedienteId = paramToString(req.params.id);
      if (!expedienteId) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Expediente invalido.");
      }

      const summary = await expedientesService.getOperationalSummary(expedienteId);
      return res.status(200).json(summary);
    } catch (error) {
      if (error instanceof ExpedienteServiceError) {
        return sendApiError(
          res,
          error.statusCode,
          mapExpedienteServiceStatusToErrorCode(error.statusCode),
          error.message
        );
      }
      return sendApiError(
        res,
        500,
        API_ERROR_CODE.internalError,
        "No fue posible obtener la consulta operativa del expediente."
      );
    }
  }
);

expedientesRouter.get(
  "/:id/workflow",
  authorize("workflow.read", {
    resource: "expediente",
    getResourceId: (req) => paramToString(req.params.id)
  }),
  async (req, res) => {
    try {
      const expedienteId = paramToString(req.params.id);
      if (!expedienteId) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Expediente invalido.");
      }

      const workflow = await workflowService.getWorkflow(expedienteId);
      return res.status(200).json(workflow);
    } catch (error) {
      if (error instanceof ExpedienteServiceError) {
        return sendApiError(
          res,
          error.statusCode,
          mapExpedienteServiceStatusToErrorCode(error.statusCode),
          error.message
        );
      }
      return sendApiError(
        res,
        500,
        API_ERROR_CODE.internalError,
        "No fue posible obtener el workflow del expediente."
      );
    }
  }
);

expedientesRouter.post(
  "/:id/change-state",
  authorize("expedientes.change_state", {
    resource: "expediente",
    getResourceId: (req) => paramToString(req.params.id)
  }),
  async (req, res) => {
    try {
      const expedienteId = paramToString(req.params.id);
      const { estadoNuevo, comentario } = req.body ?? {};
      const auth = res.locals.auth as AuthContext | undefined;
      const estadoNuevoValue = bodyString(estadoNuevo);

      if (!expedienteId) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Expediente invalido.");
      }
      if (!estadoNuevoValue) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidPayload, "Payload invalido.");
      }
      if (!auth) {
        return sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "No autenticado.");
      }

      const result = await expedientesService.changeState({
        expedienteId,
        estadoNuevo: estadoNuevoValue,
        changedByUserId: auth.userId,
        comentario: bodyString(comentario),
        ipAddress: req.ip
      });

      return res.status(200).json({
        ...result,
        message: "Estado de expediente actualizado correctamente."
      });
    } catch (error) {
      if (error instanceof ExpedienteServiceError) {
        return sendApiError(
          res,
          error.statusCode,
          mapExpedienteServiceStatusToErrorCode(error.statusCode),
          error.message
        );
      }
      return sendApiError(
        res,
        500,
        API_ERROR_CODE.internalError,
        "No fue posible registrar auditoria de la accion critica."
      );
    }
  }
);

expedientesRouter.post(
  "/:id/reopen-stage",
  authorize("workflow.reopen_stage", {
    resource: "expediente",
    getResourceId: (req) => paramToString(req.params.id)
  }),
  async (req, res) => {
    try {
      const expedienteId = paramToString(req.params.id);
      const { etapa, motivo } = req.body ?? {};
      const auth = res.locals.auth as AuthContext | undefined;
      const etapaValue = bodyString(etapa);
      const motivoValue = bodyString(motivo);

      if (!expedienteId) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "Expediente invalido.");
      }
      if (!etapaValue || !motivoValue) {
        return sendApiError(res, 400, API_ERROR_CODE.invalidPayload, "Payload invalido.");
      }
      if (!auth) {
        return sendApiError(res, 401, API_ERROR_CODE.unauthenticated, "No autenticado.");
      }

      const result = await expedientesService.reopenStage({
        expedienteId,
        etapa: etapaValue,
        motivo: motivoValue,
        reopenedByUserId: auth.userId,
        ipAddress: req.ip
      });

      return res.status(200).json({
        ...result,
        message: "Etapa reabierta correctamente."
      });
    } catch (error) {
      if (error instanceof ExpedienteServiceError) {
        return sendApiError(
          res,
          error.statusCode,
          mapExpedienteServiceStatusToErrorCode(error.statusCode),
          error.message
        );
      }
      return sendApiError(
        res,
        500,
        API_ERROR_CODE.internalError,
        "No fue posible registrar auditoria de la accion critica."
      );
    }
  }
);
