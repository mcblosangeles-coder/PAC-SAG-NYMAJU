import {
  Prisma,
  EstadoAlerta,
  EstadoEtapa,
  EstadoExpedienteGlobal,
  EstadoNoConformidad,
  SeveridadNC,
  TipoEtapa
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  buildOperationalSummary,
  type OperationalSummaryView
} from "./operational-summary.mapper";

export class ExpedienteServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ExpedienteServiceError";
  }
}

type ChangeStateInput = {
  expedienteId: string;
  estadoNuevo: string;
  changedByUserId: string;
  comentario?: string | null;
  ipAddress?: string | null;
};

type ChangeStateResult = {
  expedienteId: string;
  estadoAnterior: EstadoExpedienteGlobal;
  estadoNuevo: EstadoExpedienteGlobal;
};

type ReopenStageInput = {
  expedienteId: string;
  etapa: string;
  motivo: string;
  reopenedByUserId: string;
  ipAddress?: string | null;
};

type ReopenStageResult = {
  expedienteId: string;
  etapa: TipoEtapa;
  estadoAnterior: EstadoEtapa;
  estadoNuevo: EstadoEtapa;
};

type OperationalSummaryResult = OperationalSummaryView;

type ListOperationalSummariesInput = {
  q?: string | null;
  estadoGlobal?: string | null;
  responsableUserId?: string | null;
  page: number;
  pageSize: number;
};

type ListOperationalSummariesResult = {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  items: OperationalSummaryView[];
};

type HistoryScopeFilter = "all" | "global" | "stage";

type GetStateHistoryInput = {
  expedienteId: string;
  page: number;
  pageSize: number;
  scope: HistoryScopeFilter;
};

type StateHistoryItem = {
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
};

type GetStateHistoryResult = {
  expedienteId: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  items: StateHistoryItem[];
};

const ALLOWED_TRANSITIONS: Record<EstadoExpedienteGlobal, EstadoExpedienteGlobal[]> = {
  BORRADOR: ["RECIBIDO", "RECHAZADO"],
  RECIBIDO: ["DOCUMENTAL", "RECHAZADO", "VENCIDO"],
  DOCUMENTAL: ["INCOMPATIBILIDADES", "OBSERVADO", "RECHAZADO"],
  INCOMPATIBILIDADES: ["TECNICA", "OBSERVADO", "RECHAZADO"],
  TECNICA: ["LEGAL", "OBSERVADO", "RECHAZADO"],
  LEGAL: ["KML_SIG", "OBSERVADO", "RECHAZADO"],
  KML_SIG: ["INFORME", "OBSERVADO", "RECHAZADO"],
  OBSERVADO: ["CORRECCION", "RECHAZADO"],
  CORRECCION: ["DOCUMENTAL", "TECNICA", "LEGAL", "KML_SIG"],
  INFORME: ["CONTROL", "OBSERVADO", "RECHAZADO"],
  CONTROL: ["APROBADO", "OBSERVADO", "RECHAZADO"],
  APROBADO: ["INGRESADO", "VENCIDO"],
  INGRESADO: ["CERRADO"],
  CERRADO: [],
  RECHAZADO: [],
  VENCIDO: []
};

const ALLOWED_REOPEN_SOURCE_STATES: EstadoEtapa[] = [
  EstadoEtapa.CERRADA,
  EstadoEtapa.RECHAZADA,
  EstadoEtapa.VENCIDA,
  EstadoEtapa.BLOQUEADA,
  EstadoEtapa.OBSERVADA
];

const PRECONDITION_TARGETS_REQUIRING_CLEAN_BLOCKERS = new Set<EstadoExpedienteGlobal>([
  EstadoExpedienteGlobal.APROBADO,
  EstadoExpedienteGlobal.INGRESADO,
  EstadoExpedienteGlobal.CERRADO
]);

const normalizeText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const isEstadoExpedienteGlobal = (value: string): value is EstadoExpedienteGlobal =>
  Object.values(EstadoExpedienteGlobal).includes(value as EstadoExpedienteGlobal);

const isTipoEtapa = (value: string): value is TipoEtapa =>
  Object.values(TipoEtapa).includes(value as TipoEtapa);

export const expedientesService = {
  async listOperationalSummaries(
    input: ListOperationalSummariesInput
  ): Promise<ListOperationalSummariesResult> {
    const q = normalizeText(input.q);
    const responsableUserId = normalizeText(input.responsableUserId);
    const estadoGlobalRaw = normalizeText(input.estadoGlobal);
    let estadoGlobal: EstadoExpedienteGlobal | null = null;

    if (estadoGlobalRaw && !isEstadoExpedienteGlobal(estadoGlobalRaw)) {
      throw new ExpedienteServiceError("estadoGlobal invalido.", 400);
    }
    if (estadoGlobalRaw) {
      estadoGlobal = estadoGlobalRaw as EstadoExpedienteGlobal;
    }

    const where: Prisma.ExpedienteWhereInput = {
      deletedAt: null
    };

    if (estadoGlobal) {
      where.estadoGlobal = estadoGlobal;
    }

    if (responsableUserId) {
      where.profesionalResponsableId = responsableUserId;
    }

    if (q) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { codigoInterno: { contains: q, mode: "insensitive" } },
        { nombreProyecto: { contains: q, mode: "insensitive" } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.expediente.count({ where }),
      prisma.expediente.findMany({
        where,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: [
          { updatedAt: "desc" },
          { createdAt: "desc" }
        ],
        select: {
          id: true,
          codigoInterno: true,
          estadoGlobal: true,
          nombreProyecto: true,
          updatedAt: true,
          profesionalResponsable: {
            select: {
              id: true,
              fullName: true
            }
          },
          etapas: {
            select: {
              id: true,
              tipoEtapa: true,
              estadoEtapa: true,
              dueAt: true,
              responsable: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            },
            orderBy: {
              createdAt: "asc"
            }
          },
          _count: {
            select: {
              alertas: {
                where: {
                  status: EstadoAlerta.ACTIVA,
                  blocking: true
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
                }
              }
            }
          }
        }
      })
    ]);

    const items = rows.map((row) =>
      buildOperationalSummary({
        expedienteId: row.id,
        codigoInterno: row.codigoInterno,
        estadoGlobal: row.estadoGlobal,
        nombreProyecto: row.nombreProyecto,
        profesionalResponsable: row.profesionalResponsable,
        etapas: row.etapas,
        blockingAlertsCount: row._count.alertas,
        blockingNcCount: row._count.noConformidades,
        updatedAt: row.updatedAt
      })
    );

    const totalPages = total === 0 ? 0 : Math.ceil(total / input.pageSize);

    return {
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages,
        hasNext: input.page * input.pageSize < total
      },
      items
    };
  },

  async getStateHistory(input: GetStateHistoryInput): Promise<GetStateHistoryResult> {
    const expediente = await prisma.expediente.findFirst({
      where: {
        id: input.expedienteId,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    if (!expediente) {
      throw new ExpedienteServiceError("Expediente no encontrado.", 404);
    }

    const includeGlobal = input.scope === "all" || input.scope === "global";
    const includeStage = input.scope === "all" || input.scope === "stage";

    const [globalRows, stageRows] = await Promise.all([
      includeGlobal
        ? prisma.expedienteHistorialEstado.findMany({
            where: { expedienteId: expediente.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              createdAt: true,
              estadoAnterior: true,
              estadoNuevo: true,
              comentario: true,
              changedBy: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          })
        : Promise.resolve([]),
      includeStage
        ? prisma.expedienteEtapaHistorialEstado.findMany({
            where: {
              expedienteEtapa: {
                expedienteId: expediente.id
              }
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              createdAt: true,
              estadoAnterior: true,
              estadoNuevo: true,
              comentario: true,
              changedBy: {
                select: {
                  id: true,
                  fullName: true
                }
              },
              expedienteEtapa: {
                select: {
                  id: true,
                  tipoEtapa: true
                }
              }
            }
          })
        : Promise.resolve([])
    ]);

    const merged: StateHistoryItem[] = [
      ...globalRows.map((row) => ({
        id: row.id,
        scope: "GLOBAL" as const,
        createdAt: row.createdAt,
        estadoAnterior: row.estadoAnterior,
        estadoNuevo: row.estadoNuevo,
        comentario: row.comentario,
        changedBy: row.changedBy
          ? {
              userId: row.changedBy.id,
              fullName: row.changedBy.fullName
            }
          : null,
        etapa: null
      })),
      ...stageRows.map((row) => ({
        id: row.id,
        scope: "ETAPA" as const,
        createdAt: row.createdAt,
        estadoAnterior: row.estadoAnterior,
        estadoNuevo: row.estadoNuevo,
        comentario: row.comentario,
        changedBy: row.changedBy
          ? {
              userId: row.changedBy.id,
              fullName: row.changedBy.fullName
            }
          : null,
        etapa: {
          id: row.expedienteEtapa.id,
          tipoEtapa: row.expedienteEtapa.tipoEtapa
        }
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = merged.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / input.pageSize);
    const start = (input.page - 1) * input.pageSize;
    const items = merged.slice(start, start + input.pageSize);

    return {
      expedienteId: expediente.id,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages,
        hasNext: input.page * input.pageSize < total
      },
      items
    };
  },

  async getOperationalSummary(expedienteId: string): Promise<OperationalSummaryResult> {
    const expediente = await prisma.expediente.findFirst({
      where: {
        id: expedienteId,
        deletedAt: null
      },
      select: {
        id: true,
        codigoInterno: true,
        estadoGlobal: true,
        nombreProyecto: true,
        updatedAt: true,
        profesionalResponsable: {
          select: {
            id: true,
            fullName: true
          }
        },
        etapas: {
          select: {
            id: true,
            tipoEtapa: true,
            estadoEtapa: true,
            dueAt: true,
            responsable: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        },
        _count: {
          select: {
            alertas: {
              where: {
                status: EstadoAlerta.ACTIVA,
                blocking: true
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
              }
            }
          }
        }
      }
    });

    if (!expediente) {
      throw new ExpedienteServiceError("Expediente no encontrado.", 404);
    }

    return buildOperationalSummary({
      expedienteId: expediente.id,
      codigoInterno: expediente.codigoInterno,
      estadoGlobal: expediente.estadoGlobal,
      nombreProyecto: expediente.nombreProyecto,
      profesionalResponsable: expediente.profesionalResponsable,
      etapas: expediente.etapas,
      blockingAlertsCount: expediente._count.alertas,
      blockingNcCount: expediente._count.noConformidades,
      updatedAt: expediente.updatedAt
    });
  },

  async changeState(input: ChangeStateInput): Promise<ChangeStateResult> {
    const estadoNuevoRaw = input.estadoNuevo.trim();
    if (!isEstadoExpedienteGlobal(estadoNuevoRaw)) {
      throw new ExpedienteServiceError("estadoNuevo inválido.", 400);
    }

    const comentario = normalizeText(input.comentario);
    const ipAddress = normalizeText(input.ipAddress);

    return prisma.$transaction(async (tx) => {
      const expediente = await tx.expediente.findFirst({
        where: {
          id: input.expedienteId,
          deletedAt: null
        },
        select: {
          id: true,
          estadoGlobal: true
        }
      });

      if (!expediente) {
        throw new ExpedienteServiceError("Expediente no encontrado.", 404);
      }

      if (expediente.estadoGlobal === estadoNuevoRaw) {
        throw new ExpedienteServiceError(
          `El expediente ya se encuentra en estado ${estadoNuevoRaw}.`,
          409
        );
      }

      const allowedTargets = ALLOWED_TRANSITIONS[expediente.estadoGlobal] ?? [];
      if (!allowedTargets.includes(estadoNuevoRaw)) {
        throw new ExpedienteServiceError(
          `Transición inválida: ${expediente.estadoGlobal} -> ${estadoNuevoRaw}.`,
          409
        );
      }

      if (PRECONDITION_TARGETS_REQUIRING_CLEAN_BLOCKERS.has(estadoNuevoRaw)) {
        const [blockingAlertsCount, blockingNcCount] = await Promise.all([
          tx.alerta.count({
            where: {
              expedienteId: expediente.id,
              status: EstadoAlerta.ACTIVA,
              blocking: true
            }
          }),
          tx.noConformidad.count({
            where: {
              expedienteId: expediente.id,
              deletedAt: null,
              status: {
                in: [EstadoNoConformidad.ABIERTA, EstadoNoConformidad.EN_PROCESO]
              },
              severity: {
                in: [SeveridadNC.MAYOR, SeveridadNC.CRITICA]
              }
            }
          })
        ]);

        if (blockingAlertsCount > 0 || blockingNcCount > 0) {
          throw new ExpedienteServiceError(
            "Precondicion de workflow no cumplida: existen bloqueos activos para avanzar.",
            422
          );
        }
      }

      await tx.expediente.update({
        where: { id: expediente.id },
        data: {
          estadoGlobal: estadoNuevoRaw,
          updatedById: input.changedByUserId
        }
      });

      await tx.expedienteHistorialEstado.create({
        data: {
          expedienteId: expediente.id,
          estadoAnterior: expediente.estadoGlobal,
          estadoNuevo: estadoNuevoRaw,
          changedByUserId: input.changedByUserId,
          comentario
        }
      });

      await tx.auditLog.create({
        data: {
          userId: input.changedByUserId,
          expedienteId: expediente.id,
          accion: "expedientes.change_state",
          entityType: "EXPEDIENTE",
          entityId: expediente.id,
          valorAnterior: { estadoGlobal: expediente.estadoGlobal },
          valorNuevo: { estadoGlobal: estadoNuevoRaw },
          comentario,
          ipAddress
        }
      });

      return {
        expedienteId: expediente.id,
        estadoAnterior: expediente.estadoGlobal,
        estadoNuevo: estadoNuevoRaw
      };
    });
  },

  async reopenStage(input: ReopenStageInput): Promise<ReopenStageResult> {
    const etapaRaw = input.etapa.trim();
    if (!isTipoEtapa(etapaRaw)) {
      throw new ExpedienteServiceError("etapa inválida.", 400);
    }

    const motivo = normalizeText(input.motivo);
    if (!motivo) {
      throw new ExpedienteServiceError("motivo es obligatorio.", 400);
    }
    const ipAddress = normalizeText(input.ipAddress);

    return prisma.$transaction(async (tx) => {
      const expediente = await tx.expediente.findFirst({
        where: { id: input.expedienteId, deletedAt: null },
        select: { id: true }
      });
      if (!expediente) {
        throw new ExpedienteServiceError("Expediente no encontrado.", 404);
      }

      const etapa = await tx.expedienteEtapa.findUnique({
        where: {
          expedienteId_tipoEtapa: {
            expedienteId: input.expedienteId,
            tipoEtapa: etapaRaw
          }
        },
        select: {
          id: true,
          estadoEtapa: true
        }
      });

      if (!etapa) {
        throw new ExpedienteServiceError("Etapa no encontrada para el expediente.", 404);
      }

      if (!ALLOWED_REOPEN_SOURCE_STATES.includes(etapa.estadoEtapa)) {
        throw new ExpedienteServiceError(
          `La etapa ${etapaRaw} no se puede reabrir desde estado ${etapa.estadoEtapa}.`,
          409
        );
      }

      await tx.expedienteEtapa.update({
        where: { id: etapa.id },
        data: {
          estadoEtapa: EstadoEtapa.REABIERTA
        }
      });

      await tx.reaperturaEtapa.create({
        data: {
          expedienteId: expediente.id,
          expedienteEtapaId: etapa.id,
          reopenedByUserId: input.reopenedByUserId,
          motivo,
          estadoAnterior: etapa.estadoEtapa,
          estadoNuevo: EstadoEtapa.REABIERTA
        }
      });

      await tx.expedienteEtapaHistorialEstado.create({
        data: {
          expedienteEtapaId: etapa.id,
          estadoAnterior: etapa.estadoEtapa,
          estadoNuevo: EstadoEtapa.REABIERTA,
          changedByUserId: input.reopenedByUserId,
          comentario: motivo
        }
      });

      await tx.auditLog.create({
        data: {
          userId: input.reopenedByUserId,
          expedienteId: expediente.id,
          accion: "workflow.reopen_stage",
          entityType: "ETAPA",
          entityId: etapa.id,
          valorAnterior: { estadoEtapa: etapa.estadoEtapa, tipoEtapa: etapaRaw },
          valorNuevo: { estadoEtapa: EstadoEtapa.REABIERTA, tipoEtapa: etapaRaw },
          comentario: motivo,
          ipAddress
        }
      });

      return {
        expedienteId: expediente.id,
        etapa: etapaRaw,
        estadoAnterior: etapa.estadoEtapa,
        estadoNuevo: EstadoEtapa.REABIERTA
      };
    });
  }
};
