import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { operationalMetricsService } from "../metrics/operational-metrics.service";

type AuditScopeType = "EXPEDIENTE" | "ETAPA" | "SISTEMA";

export type AuditLogInput = {
  usuarioId?: string | null;
  expedienteId?: string | null;
  accion: string;
  scopeType?: AuditScopeType;
  scopeId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  valorAnterior?: Prisma.InputJsonValue;
  valorNuevo?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  comentario?: string | null;
  ipAddress?: string | null;
  ip?: string | null;
};

const normalizeText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const resolveEntityType = (input: AuditLogInput): string => {
  const explicit = normalizeText(input.entityType ?? null);
  if (explicit) return explicit;
  return input.scopeType ?? "SISTEMA";
};

const resolveEntityId = (input: AuditLogInput, entityType: string): string => {
  const explicit = normalizeText(input.entityId ?? null);
  if (explicit) return explicit;

  const scopeId = normalizeText(input.scopeId ?? null);
  if (scopeId) return scopeId;

  if (entityType === "SISTEMA") return "SYSTEM";

  throw new Error(`AuditLog requires entityId/scopeId for entityType=${entityType}`);
};

export const auditService = {
  async log(input: AuditLogInput): Promise<void> {
    const accion = normalizeText(input.accion);
    if (!accion) {
      throw new Error("AuditLog requires accion.");
    }

    const entityType = resolveEntityType(input);
    const entityId = resolveEntityId(input, entityType);

    await prisma.auditLog.create({
      data: {
        userId: normalizeText(input.usuarioId),
        expedienteId: normalizeText(input.expedienteId),
        accion,
        entityType,
        entityId,
        valorAnterior: input.valorAnterior,
        valorNuevo: input.valorNuevo ?? input.metadata,
        comentario: normalizeText(input.comentario),
        ipAddress: normalizeText(input.ipAddress ?? input.ip)
      }
    });
  },

  async safeLog(input: AuditLogInput): Promise<void> {
    try {
      await this.log(input);
    } catch (error) {
      operationalMetricsService.recordAuditLogFailure();
      // No romper flujo funcional por falla de auditoria en etapa MVP.
      logger.error("audit.log.failed_non_blocking", "Audit log failed in non-blocking mode.", error, {
        accion: input.accion,
        userId: input.usuarioId ?? null,
        expedienteId: input.expedienteId ?? null,
        scopeType: input.scopeType ?? null,
        scopeId: input.scopeId ?? null
      });
    }
  }
};
