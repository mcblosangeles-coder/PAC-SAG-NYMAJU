import { prisma } from "../../lib/prisma";

export type AccessScope = "self" | "module" | "all" | "none";

const SCOPE_ORDER: Record<Exclude<AccessScope, "none">, number> = {
  self: 1,
  module: 2,
  all: 3
};

const PERMISSION_SCOPE_OVERRIDES: Record<string, Record<string, Exclude<AccessScope, "none">>> = {
  "workflow.read": {
    director_pac: "all",
    admin_sistema: "all",
    responsable_control_final: "all",
    responsable_auditoria_calidad: "all",
    revisor_documental: "module",
    revisor_tecnico: "module",
    revisor_legal: "module",
    encargado_kml_sig: "module",
    usuario_consulta: "module",
    profesional_responsable: "self"
  },
  "expedientes.change_state": {
    director_pac: "all",
    responsable_control_final: "all"
  },
  "workflow.reopen_stage": {
    director_pac: "all",
    responsable_control_final: "all",
    admin_sistema: "module"
  }
};

const DEFAULT_SCOPE_BY_ROLE: Record<string, Exclude<AccessScope, "none">> = {
  director_pac: "all",
  admin_sistema: "all",
  responsable_control_final: "all",
  responsable_auditoria_calidad: "all",
  revisor_documental: "module",
  revisor_tecnico: "module",
  revisor_legal: "module",
  encargado_kml_sig: "module",
  usuario_consulta: "module",
  profesional_responsable: "self"
};

const maxScope = (current: AccessScope, candidate: Exclude<AccessScope, "none">): AccessScope => {
  if (current === "none") return candidate;
  return SCOPE_ORDER[candidate] > SCOPE_ORDER[current as Exclude<AccessScope, "none">]
    ? candidate
    : current;
};

const resolveScopeForPermission = (roles: string[], permissionCode: string): AccessScope => {
  const override = PERMISSION_SCOPE_OVERRIDES[permissionCode];
  if (override) {
    let scope: AccessScope = "none";
    for (const role of roles) {
      const candidate = override[role];
      if (candidate) scope = maxScope(scope, candidate);
    }
    return scope;
  }

  let scope: AccessScope = "none";
  for (const role of roles) {
    const candidate = DEFAULT_SCOPE_BY_ROLE[role];
    if (candidate) scope = maxScope(scope, candidate);
  }
  return scope;
};

type EvaluateExpedienteAccessInput = {
  userId: string;
  scope: AccessScope;
  expedienteId: string;
};

const evaluateExpedienteAccess = async (
  input: EvaluateExpedienteAccessInput
): Promise<boolean> => {
  if (input.scope === "all") return true;
  if (input.scope === "none") return false;

  const expediente = await prisma.expediente.findUnique({
    where: { id: input.expedienteId },
    select: {
      id: true,
      profesionalResponsableId: true,
      revisorAsignadoId: true,
      createdById: true,
      etapas: {
        select: {
          responsableUserId: true
        }
      }
    }
  });

  if (!expediente) return false;

  const isSelf =
    expediente.profesionalResponsableId === input.userId ||
    expediente.revisorAsignadoId === input.userId ||
    expediente.createdById === input.userId;

  if (input.scope === "self") return isSelf;

  const hasModuleAssignment =
    isSelf || expediente.etapas.some((etapa) => etapa.responsableUserId === input.userId);

  return hasModuleAssignment;
};

export const scopePolicy = {
  resolveScopeForPermission,
  evaluateExpedienteAccess
};
