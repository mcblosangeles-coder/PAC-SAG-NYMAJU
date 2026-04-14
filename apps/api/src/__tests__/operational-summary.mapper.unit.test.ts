import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOperationalSummary } from "../modules/expedientes/operational-summary.mapper";

describe("operational-summary mapper", () => {
  it("prioritizes active stage responsable over profesional responsable", () => {
    const summary = buildOperationalSummary({
      expedienteId: "EXP-001",
      codigoInterno: "PAC-2026-001",
      estadoGlobal: "DOCUMENTAL",
      nombreProyecto: "Proyecto A",
      profesionalResponsable: {
        id: "USR-PROF",
        fullName: "Profesional Responsable"
      },
      etapas: [
        {
          id: "ETP-01",
          tipoEtapa: "REVISION_TECNICA",
          estadoEtapa: "EN_PROGRESO",
          dueAt: new Date("2026-04-20T00:00:00.000Z"),
          responsable: {
            id: "USR-STAGE",
            fullName: "Responsable de Etapa"
          }
        }
      ],
      blockingAlertsCount: 0,
      blockingNcCount: 0,
      updatedAt: new Date("2026-04-13T20:00:00.000Z")
    });

    assert.equal(summary.responsableActual?.userId, "USR-STAGE");
    assert.equal(summary.bloqueos.count, 0);
    assert.equal(summary.canAdvance, true);
  });

  it("falls back to profesional responsable and computes blocking flags/count", () => {
    const summary = buildOperationalSummary({
      expedienteId: "EXP-002",
      codigoInterno: "PAC-2026-002",
      estadoGlobal: "TECNICA",
      nombreProyecto: null,
      profesionalResponsable: {
        id: "USR-PROF",
        fullName: "Profesional Responsable"
      },
      etapas: [
        {
          id: "ETP-02",
          tipoEtapa: "REVISION_DOCUMENTAL",
          estadoEtapa: "CERRADA",
          dueAt: null,
          responsable: null
        }
      ],
      blockingAlertsCount: 1,
      blockingNcCount: 2,
      updatedAt: new Date("2026-04-13T20:00:00.000Z")
    });

    assert.equal(summary.responsableActual?.userId, "USR-PROF");
    assert.equal(summary.bloqueos.hasBlockingAlerts, true);
    assert.equal(summary.bloqueos.hasBlockingNc, true);
    assert.equal(summary.bloqueos.count, 3);
    assert.equal(summary.canAdvance, false);
    assert.equal(summary.proyecto, null);
  });
});
