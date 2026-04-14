import { EstadoEtapa } from "@prisma/client";

export type OperationalSummaryInput = {
  expedienteId: string;
  codigoInterno: string;
  estadoGlobal: string;
  nombreProyecto: string | null;
  profesionalResponsable: {
    id: string;
    fullName: string;
  } | null;
  etapas: Array<{
    id: string;
    tipoEtapa: string;
    estadoEtapa: string;
    dueAt: Date | null;
    responsable: {
      id: string;
      fullName: string;
    } | null;
  }>;
  blockingAlertsCount: number;
  blockingNcCount: number;
  updatedAt: Date;
};

export type OperationalSummaryView = {
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
};

const ACTIVE_STAGE_STATES = new Set<EstadoEtapa>([
  EstadoEtapa.EN_PROGRESO,
  EstadoEtapa.HABILITADA,
  EstadoEtapa.REABIERTA
]);

export const buildOperationalSummary = (input: OperationalSummaryInput): OperationalSummaryView => {
  const activeStage = input.etapas.find(
    (etapa) =>
      ACTIVE_STAGE_STATES.has(etapa.estadoEtapa as EstadoEtapa) && etapa.responsable !== null
  );

  const responsableActual = activeStage?.responsable
    ? {
        userId: activeStage.responsable.id,
        fullName: activeStage.responsable.fullName
      }
    : input.profesionalResponsable
      ? {
          userId: input.profesionalResponsable.id,
          fullName: input.profesionalResponsable.fullName
        }
      : null;

  const hasBlockingAlerts = input.blockingAlertsCount > 0;
  const hasBlockingNc = input.blockingNcCount > 0;
  const blockingCount = input.blockingAlertsCount + input.blockingNcCount;

  return {
    expedienteId: input.expedienteId,
    codigoInterno: input.codigoInterno,
    estadoGlobal: input.estadoGlobal,
    proyecto: input.nombreProyecto
      ? {
          id: input.expedienteId,
          nombre: input.nombreProyecto
        }
      : null,
    responsableActual,
    etapasResumen: input.etapas.map((etapa) => ({
      id: etapa.id,
      tipoEtapa: etapa.tipoEtapa,
      estadoEtapa: etapa.estadoEtapa,
      dueAt: etapa.dueAt
    })),
    bloqueos: {
      hasBlockingAlerts,
      hasBlockingNc,
      count: blockingCount
    },
    canAdvance: !hasBlockingAlerts && !hasBlockingNc,
    updatedAt: input.updatedAt
  };
};
