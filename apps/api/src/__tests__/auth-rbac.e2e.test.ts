import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import jwt from "jsonwebtoken";
import { ExpedienteServiceError } from "../modules/expedientes/expedientes.service";

process.env.NODE_ENV = "test";
process.env.API_PREFIX = "/api/v1";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://pac_user:pac_password@localhost:5432/pac_nymaju_spr?schema=public";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret";

type SecurityDeps = {
  permissionsService: {
    hasPermission: (userId: string, permissionCode: string) => Promise<boolean>;
  };
};

type ScopeDeps = {
  scopePolicy: {
    evaluateExpedienteAccess: (input: {
      userId: string;
      scope: "self" | "module" | "all" | "none";
      expedienteId: string;
    }) => Promise<boolean>;
  };
};

type WorkflowDeps = {
  workflowService: {
    getWorkflow: (expedienteId: string) => Promise<{
      expedienteId: string;
      codigoInterno: string;
      estadoGlobal: string;
      etapas: Array<{
        id: string;
        tipoEtapa: string;
        estadoEtapa: string;
        responsableUserId: string | null;
        responsableNombre: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        dueAt: Date | null;
      }>;
      blockingReasons: Array<{
        type: "ALERTA" | "NC";
        id: string;
        code?: string | null;
        severity: string;
        title: string;
        description: string;
      }>;
      hasBlockingAlerts: boolean;
      hasBlockingNc: boolean;
      canAdvance: boolean;
    }>;
  };
};

type ExpedientesDeps = {
  expedientesService: {
    listOperationalSummaries: (input: {
      q?: string | null;
      estadoGlobal?: string | null;
      responsableUserId?: string | null;
      page: number;
      pageSize: number;
    }) => Promise<{
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
      };
      items: Array<{
        expedienteId: string;
        codigoInterno: string;
        estadoGlobal: string;
        proyecto: {
          id: string;
          nombre: string;
        } | null;
        responsableActual: {
          userId: string;
          fullName: string;
        } | null;
        etapasResumen: Array<{
          id: string;
          tipoEtapa: string;
          estadoEtapa: string;
          dueAt: Date | null;
        }>;
        bloqueos: {
          hasBlockingAlerts: boolean;
          hasBlockingNc: boolean;
          count: number;
        };
        canAdvance: boolean;
        updatedAt: Date;
      }>;
    }>;
    getStateHistory: (input: {
      expedienteId: string;
      page: number;
      pageSize: number;
      scope: "all" | "global" | "stage";
    }) => Promise<{
      expedienteId: string;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
      };
      items: Array<{
        id: string;
        scope: "GLOBAL" | "ETAPA";
        createdAt: Date;
        estadoAnterior: string | null;
        estadoNuevo: string;
        comentario: string | null;
        changedBy: {
          userId: string;
          fullName: string;
        } | null;
        etapa: {
          id: string;
          tipoEtapa: string;
        } | null;
      }>;
    }>;
    getOperationalSummary: (expedienteId: string) => Promise<{
      expedienteId: string;
      codigoInterno: string;
      estadoGlobal: string;
      proyecto: {
        id: string;
        nombre: string;
      } | null;
      responsableActual: {
        userId: string;
        fullName: string;
      } | null;
      etapasResumen: Array<{
        id: string;
        tipoEtapa: string;
        estadoEtapa: string;
        dueAt: Date | null;
      }>;
      bloqueos: {
        hasBlockingAlerts: boolean;
        hasBlockingNc: boolean;
        count: number;
      };
      canAdvance: boolean;
      updatedAt: Date;
    }>;
    changeState: (input: {
      expedienteId: string;
      estadoNuevo: string;
      changedByUserId: string;
      comentario?: string | null;
      ipAddress?: string | null;
    }) => Promise<{
      expedienteId: string;
      estadoAnterior: string;
      estadoNuevo: string;
    }>;
    reopenStage: (input: {
      expedienteId: string;
      etapa: string;
      motivo: string;
      reopenedByUserId: string;
      ipAddress?: string | null;
    }) => Promise<{
      expedienteId: string;
      etapa: string;
      estadoAnterior: string;
      estadoNuevo: string;
    }>;
  };
};

const signAccessToken = (userId = "test-user", roles: string[] = ["admin_sistema"]): string =>
  jwt.sign(
    {
      sub: userId,
      email: "test@pac.local",
      roles,
      permissions: ["workflow.read", "workflow.reopen_stage", "expedientes.change_state"]
    },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" }
  );

const signAccessTokenWithoutSub = (): string =>
  jwt.sign(
    {
      email: "test@pac.local",
      roles: ["admin_sistema"],
      permissions: ["workflow.read"]
    },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" }
  );

describe("Auth + RBAC middleware integration", async () => {
  const { createApp } = await import("../app");
  const app = createApp();

  const securityDeps = (await import("../modules/rbac/permissions.service")) as unknown as SecurityDeps;
  const scopeDeps = (await import("../modules/rbac/scope.policy")) as unknown as ScopeDeps;
  const workflowDeps = (await import("../modules/expedientes/workflow.service")) as unknown as WorkflowDeps;
  const expedientesDeps = (await import("../modules/expedientes/expedientes.service")) as unknown as ExpedientesDeps;

  const originalHasPermission = securityDeps.permissionsService.hasPermission;
  const originalEvaluateExpedienteAccess = scopeDeps.scopePolicy.evaluateExpedienteAccess;
  const originalGetWorkflow = workflowDeps.workflowService.getWorkflow;
  const originalListOperationalSummaries = expedientesDeps.expedientesService.listOperationalSummaries;
  const originalGetStateHistory = expedientesDeps.expedientesService.getStateHistory;
  const originalGetOperationalSummary = expedientesDeps.expedientesService.getOperationalSummary;
  const originalChangeState = expedientesDeps.expedientesService.changeState;
  const originalReopenStage = expedientesDeps.expedientesService.reopenStage;

  let server: http.Server;
  let baseUrl = "";

  before(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.on("listening", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to start test server.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  beforeEach(() => {
    securityDeps.permissionsService.hasPermission = async () => false;
    scopeDeps.scopePolicy.evaluateExpedienteAccess = async () => true;
    workflowDeps.workflowService.getWorkflow = async (expedienteId) => ({
      expedienteId,
      codigoInterno: "EXP-TEST-001",
      estadoGlobal: "DOCUMENTAL",
      etapas: [],
      blockingReasons: [],
      hasBlockingAlerts: false,
      hasBlockingNc: false,
      canAdvance: true
    });
    expedientesDeps.expedientesService.listOperationalSummaries = async (input) => ({
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: 1,
        totalPages: 1,
        hasNext: false
      },
      items: [
        {
          expedienteId: "EXP-001",
          codigoInterno: "PAC-2026-001",
          estadoGlobal: "DOCUMENTAL",
          proyecto: {
            id: "PROJ-01",
            nombre: "Proyecto A"
          },
          responsableActual: {
            userId: "USR-01",
            fullName: "Nombre Usuario"
          },
          etapasResumen: [],
          bloqueos: {
            hasBlockingAlerts: false,
            hasBlockingNc: false,
            count: 0
          },
          canAdvance: true,
          updatedAt: new Date("2026-04-13T20:00:00.000Z")
        }
      ]
    });
    expedientesDeps.expedientesService.getStateHistory = async (input) => ({
      expedienteId: input.expedienteId,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: 1,
        totalPages: 1,
        hasNext: false
      },
      items: [
        {
          id: "HST-01",
          scope: "GLOBAL",
          createdAt: new Date("2026-04-13T20:00:00.000Z"),
          estadoAnterior: "RECIBIDO",
          estadoNuevo: "DOCUMENTAL",
          comentario: "Cambio validado",
          changedBy: {
            userId: "USR-01",
            fullName: "Nombre Usuario"
          },
          etapa: null
        }
      ]
    });
    expedientesDeps.expedientesService.getOperationalSummary = async (expedienteId) => ({
      expedienteId,
      codigoInterno: "PAC-2026-001",
      estadoGlobal: "DOCUMENTAL",
      proyecto: {
        id: "PROJ-01",
        nombre: "Proyecto A"
      },
      responsableActual: {
        userId: "USR-01",
        fullName: "Nombre Usuario"
      },
      etapasResumen: [],
      bloqueos: {
        hasBlockingAlerts: false,
        hasBlockingNc: false,
        count: 0
      },
      canAdvance: true,
      updatedAt: new Date("2026-04-13T20:00:00.000Z")
    });
    expedientesDeps.expedientesService.changeState = async (input) => ({
      expedienteId: input.expedienteId,
      estadoAnterior: "RECIBIDO",
      estadoNuevo: input.estadoNuevo
    });
    expedientesDeps.expedientesService.reopenStage = async (input) => ({
      expedienteId: input.expedienteId,
      etapa: input.etapa,
      estadoAnterior: "CERRADA",
      estadoNuevo: "REABIERTA"
    });
  });

  afterEach(() => {
    securityDeps.permissionsService.hasPermission = originalHasPermission;
    scopeDeps.scopePolicy.evaluateExpedienteAccess = originalEvaluateExpedienteAccess;
    workflowDeps.workflowService.getWorkflow = originalGetWorkflow;
    expedientesDeps.expedientesService.listOperationalSummaries = originalListOperationalSummaries;
    expedientesDeps.expedientesService.getStateHistory = originalGetStateHistory;
    expedientesDeps.expedientesService.getOperationalSummary = originalGetOperationalSummary;
    expedientesDeps.expedientesService.changeState = originalChangeState;
    expedientesDeps.expedientesService.reopenStage = originalReopenStage;
  });

  it("returns 401 without bearer token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-001/workflow`);
    assert.equal(response.status, 401);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "UNAUTHENTICATED");
    assert.equal(typeof body.message, "string");
  });

  it("returns 403 with valid token but missing permission in DB context", async () => {
    securityDeps.permissionsService.hasPermission = async () => false;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-001/workflow`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(typeof body.message, "string");
  });

  it("returns 200 with valid token and granted permission", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-001/workflow`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { expedienteId: string };
    assert.equal(body.expedienteId, "EXP-001");
  });

  it("returns 200 for expediente list endpoint with valid token and granted permission", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes?page=1&pageSize=20`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      pagination: { page: number; pageSize: number; total: number };
      items: Array<{ expedienteId: string }>;
    };
    assert.equal(body.pagination.page, 1);
    assert.equal(body.pagination.pageSize, 20);
    assert.equal(body.pagination.total, 1);
    assert.equal(body.items[0]?.expedienteId, "EXP-001");
  });

  it("returns 400 for expediente list endpoint when query params are invalid", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes?page=0&pageSize=200`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INVALID_PARAM");
    assert.equal(typeof body.message, "string");
  });

  it("returns 400 for expediente list endpoint when estadoGlobal filter is invalid", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.listOperationalSummaries = async () => {
      throw new ExpedienteServiceError("estadoGlobal invalido.", 400);
    };
    const response = await fetch(`${baseUrl}/api/v1/expedientes?estadoGlobal=ESTADO_INVALIDO`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INVALID_PARAM");
    assert.equal(typeof body.message, "string");
  });

  it("returns 403 for expediente list endpoint when permission is missing", async () => {
    securityDeps.permissionsService.hasPermission = async () => false;
    const response = await fetch(`${baseUrl}/api/v1/expedientes?page=1&pageSize=20`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(typeof body.message, "string");
  });

  it("returns 200 for state history endpoint with valid token and granted permission", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-020/history?page=1&pageSize=20`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { expedienteId: string; items: Array<{ id: string }> };
    assert.equal(body.expedienteId, "EXP-020");
    assert.equal(body.items.length, 1);
  });

  it("returns 400 for state history endpoint when query params are invalid", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-020/history?page=0`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INVALID_PARAM");
    assert.equal(typeof body.message, "string");
  });

  it("returns 404 for state history endpoint when expediente is not found", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.getStateHistory = async () => {
      throw new ExpedienteServiceError("Expediente no encontrado.", 404);
    };

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-404/history`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 404);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(typeof body.message, "string");
  });

  it("returns 200 for operational summary endpoint with valid token and granted permission", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-010`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { expedienteId: string; bloqueos: { count: number } };
    assert.equal(body.expedienteId, "EXP-010");
    assert.equal(body.bloqueos.count, 0);
  });

  it("returns 400 for operational summary endpoint when expediente id is invalid", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/%20`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INVALID_PARAM");
    assert.equal(typeof body.message, "string");
  });

  it("returns 403 for operational summary endpoint when scope policy denies access", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    scopeDeps.scopePolicy.evaluateExpedienteAccess = async () => false;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-011`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(typeof body.message, "string");
  });

  it("returns 404 for operational summary endpoint when expediente is not found", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.getOperationalSummary = async () => {
      throw new ExpedienteServiceError("Expediente no encontrado.", 404);
    };

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-404`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 404);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(typeof body.message, "string");
  });

  it("returns 404 when workflow service reports expediente not found", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    workflowDeps.workflowService.getWorkflow = async () => {
      throw new ExpedienteServiceError("Expediente no encontrado.", 404);
    };
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-404/workflow`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 404);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(typeof body.message, "string");
  });

  it("returns 403 when scope policy denies access to expediente", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    scopeDeps.scopePolicy.evaluateExpedienteAccess = async () => false;
    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-001/workflow`, {
      headers: { Authorization: `Bearer ${signAccessToken()}` }
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(typeof body.message, "string");
  });

  it("returns 200 for change-state real endpoint", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-002/change-state`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken("test-user", ["director_pac"])}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estadoNuevo: "APROBADO", comentario: "Prueba e2e" })
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { expedienteId: string; estadoNuevo: string };
    assert.equal(body.expedienteId, "EXP-002");
    assert.equal(body.estadoNuevo, "APROBADO");
  });

  it("returns 409 when change-state transition is invalid", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.changeState = async () => {
      throw new ExpedienteServiceError("Transicion invalida: DOCUMENTAL -> APROBADO.", 409);
    };

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-004/change-state`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken("test-user", ["director_pac"])}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estadoNuevo: "APROBADO", comentario: "Transicion no permitida" })
    });

    assert.equal(response.status, 409);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "CONFLICT");
    assert.equal(typeof body.message, "string");
  });

  it("returns 422 when change-state preconditions are not met", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.changeState = async () => {
      throw new ExpedienteServiceError(
        "Precondicion de workflow no cumplida: existen bloqueos activos para avanzar.",
        422
      );
    };

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-004/change-state`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken("test-user", ["director_pac"])}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estadoNuevo: "APROBADO", comentario: "Bloqueos activos" })
    });

    assert.equal(response.status, 422);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "UNPROCESSABLE_ENTITY");
    assert.equal(typeof body.message, "string");
  });

  it("returns 200 for reopen-stage real endpoint", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-003/reopen-stage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken("test-user", ["director_pac"])}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ etapa: "REVISION_TECNICA", motivo: "Necesita revision adicional" })
    });

    assert.equal(response.status, 200);
  });

  it("returns 409 when reopen-stage transition is invalid", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.reopenStage = async () => {
      throw new ExpedienteServiceError(
        "La etapa REVISION_TECNICA no se puede reabrir desde estado EN_PROGRESO.",
        409
      );
    };

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-005/reopen-stage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken("test-user", ["director_pac"])}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ etapa: "REVISION_TECNICA", motivo: "Transicion invalida" })
    });

    assert.equal(response.status, 409);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "CONFLICT");
    assert.equal(typeof body.message, "string");
  });

  it("returns 500 when reopen-stage service fails unexpectedly", async () => {
    securityDeps.permissionsService.hasPermission = async () => true;
    expedientesDeps.expedientesService.reopenStage = async () => {
      throw new Error("unexpected failure");
    };

    const response = await fetch(`${baseUrl}/api/v1/expedientes/EXP-006/reopen-stage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken("test-user", ["director_pac"])}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ etapa: "REVISION_TECNICA", motivo: "Falla inesperada" })
    });

    assert.equal(response.status, 500);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INTERNAL_ERROR");
    assert.equal(typeof body.message, "string");
  });

  it("returns NOT_FOUND code for unknown endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    assert.equal(response.status, 404);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(typeof body.message, "string");
  });

  it("returns INVALID_PAYLOAD code on auth login invalid payload", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "", password: "" })
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INVALID_PAYLOAD");
    assert.equal(typeof body.message, "string");
  });

  it("returns UNAUTHENTICATED on auth me without token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(response.status, 401);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "UNAUTHENTICATED");
    assert.equal(typeof body.message, "string");
  });

  it("returns UNAUTHENTICATED on auth me with malformed payload token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${signAccessTokenWithoutSub()}` }
    });
    assert.equal(response.status, 401);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "UNAUTHENTICATED");
    assert.equal(typeof body.message, "string");
  });

  it("returns NOT_FOUND on auth me when token user does not exist", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${signAccessToken("usr-not-found-e2e")}` }
    });
    assert.equal(response.status, 404);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(typeof body.message, "string");
  });

  it("returns INVALID_PAYLOAD on auth refresh without refreshToken", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "INVALID_PAYLOAD");
    assert.equal(typeof body.message, "string");
  });

  it("returns UNAUTHENTICATED on auth refresh with invalid token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalid.refresh.token" })
    });
    assert.equal(response.status, 401);
    const body = (await response.json()) as { code?: string; message?: string };
    assert.equal(body.code, "UNAUTHENTICATED");
    assert.equal(typeof body.message, "string");
  });
});
