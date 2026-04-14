import cors from "cors";
import express from "express";
import { nowIso } from "@pac/shared-utils";
import type { HealthStatus } from "@pac/shared-types";
import { env } from "./lib/env";
import { API_ERROR_CODE, sendApiError } from "./lib/api-error";
import { authRouter } from "./modules/auth/auth.routes";
import { expedientesRouter } from "./routes/expedientes.routes";

export const createApp = (): express.Express => {
  const app = express();
  const corsOrigin = env.corsOrigin;
  const apiPrefix = env.apiPrefix;

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get(`${apiPrefix}/health`, (_req, res) => {
    const payload: HealthStatus = {
      service: "api",
      status: "ok",
      timestamp: nowIso()
    };

    res.json(payload);
  });

  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/expedientes`, expedientesRouter);

  app.use((_req, res) => {
    sendApiError(res, 404, API_ERROR_CODE.notFound, "Endpoint no encontrado.");
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("Unhandled API error:", err);
      sendApiError(res, 500, API_ERROR_CODE.internalError, "Error interno del servidor.");
    }
  );

  return app;
};
