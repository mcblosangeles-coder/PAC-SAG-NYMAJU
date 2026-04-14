import { EstadoAlerta, EstadoNoConformidad, SeveridadNC } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ExpedienteServiceError } from "./expedientes.service";

export type WorkflowBlockingReason = {
  type: "ALERTA" | "NC";
  id: string;
  code?: string | null;
  severity: string;
  title: string;
  description: string;
};

export type WorkflowEtapaView = {
  id: string;
  tipoEtapa: string;
  estadoEtapa: string;
  responsableUserId: string | null;
  responsableNombre: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  dueAt: Date | null;
};

export type WorkflowView = {
  expedienteId: string;
  codigoInterno: string;
  estadoGlobal: string;
  etapas: WorkflowEtapaView[];
  blockingReasons: WorkflowBlockingReason[];
  hasBlockingAlerts: boolean;
  hasBlockingNc: boolean;
  canAdvance: boolean;
};

export const workflowService = {
  async getWorkflow(expedienteId: string): Promise<WorkflowView> {
    const expediente = await prisma.expediente.findFirst({
      where: {
        id: expedienteId,
        deletedAt: null
      },
      select: {
        id: true,
        codigoInterno: true,
        estadoGlobal: true,
        etapas: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            tipoEtapa: true,
            estadoEtapa: true,
            responsableUserId: true,
            startedAt: true,
            finishedAt: true,
            dueAt: true,
            responsable: {
              select: {
                fullName: true
              }
            }
          }
        },
        alertas: {
          where: {
            status: EstadoAlerta.ACTIVA,
            blocking: true
          },
          select: {
            id: true,
            severity: true,
            title: true,
            description: true
          }
        },
        noConformidades: {
          where: {
            deletedAt: null,
            status: {
              in: [EstadoNoConformidad.ABIERTA, EstadoNoConformidad.EN_PROCESO]
            },
            severity: {
              in: [SeveridadNC.MAYOR, SeveridadNC.CRITICA]
            }
          },
          select: {
            id: true,
            codigo: true,
            severity: true,
            titulo: true,
            descripcion: true
          }
        }
      }
    });

    if (!expediente) {
      throw new ExpedienteServiceError("Expediente no encontrado.", 404);
    }

    const alertBlockingReasons: WorkflowBlockingReason[] = expediente.alertas.map((a) => ({
      type: "ALERTA",
      id: a.id,
      severity: a.severity,
      title: a.title,
      description: a.description
    }));

    const ncBlockingReasons: WorkflowBlockingReason[] = expediente.noConformidades.map((nc) => ({
      type: "NC",
      id: nc.id,
      code: nc.codigo,
      severity: nc.severity,
      title: nc.titulo,
      description: nc.descripcion
    }));

    const hasBlockingAlerts = alertBlockingReasons.length > 0;
    const hasBlockingNc = ncBlockingReasons.length > 0;
    const blockingReasons = [...alertBlockingReasons, ...ncBlockingReasons];

    return {
      expedienteId: expediente.id,
      codigoInterno: expediente.codigoInterno,
      estadoGlobal: expediente.estadoGlobal,
      etapas: expediente.etapas.map((etapa) => ({
        id: etapa.id,
        tipoEtapa: etapa.tipoEtapa,
        estadoEtapa: etapa.estadoEtapa,
        responsableUserId: etapa.responsableUserId,
        responsableNombre: etapa.responsable?.fullName ?? null,
        startedAt: etapa.startedAt,
        finishedAt: etapa.finishedAt,
        dueAt: etapa.dueAt
      })),
      blockingReasons,
      hasBlockingAlerts,
      hasBlockingNc,
      canAdvance: !hasBlockingAlerts && !hasBlockingNc
    };
  }
};
