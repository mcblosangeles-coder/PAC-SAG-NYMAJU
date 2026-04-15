import {
  CanalRecepcion,
  EstadoAlerta,
  EstadoEtapa,
  EstadoExpedienteGlobal,
  OrigenAlerta,
  PrioridadExpediente,
  PrismaClient,
  ScopeType,
  SeveridadAlerta,
  TipoEtapa
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  CATALOGO_PARAMETROS,
  CATALOGO_TIPOS_DOCUMENTO,
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSION_MATRIX
} from "./data";

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  for (const role of ROLES) {
    await prisma.rol.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isActive: true
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isActive: true
      }
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permiso.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: {
        code: permission.code,
        name: permission.name,
        description: permission.description
      }
    });
  }

  const roles = await prisma.rol.findMany({ select: { id: true, code: true } });
  const permissions = await prisma.permiso.findMany({ select: { id: true, code: true } });

  const roleByCode = new Map(roles.map((r) => [r.code, r.id]));
  const permissionByCode = new Map(permissions.map((p) => [p.code, p.id]));

  const rolePermissionRows: Array<{ rolId: string; permisoId: string }> = [];
  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
    const roleId = roleByCode.get(roleCode);
    if (!roleId) continue;

    for (const permissionCode of permissionCodes) {
      const permisoId = permissionByCode.get(permissionCode);
      if (!permisoId) continue;
      rolePermissionRows.push({ rolId: roleId, permisoId });
    }
  }

  if (rolePermissionRows.length > 0) {
    await prisma.rolPermiso.createMany({
      data: rolePermissionRows,
      skipDuplicates: true
    });
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@pac.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe_123!";
  const adminRoleCode = process.env.SEED_ADMIN_ROLE ?? "admin_sistema";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Administrador PAC",
      initials: "AP",
      isActive: true,
      passwordHash
    },
    create: {
      email: adminEmail,
      fullName: "Administrador PAC",
      initials: "AP",
      isActive: true,
      passwordHash
    }
  });

  const adminRole = await prisma.rol.findUnique({ where: { code: adminRoleCode } });
  if (!adminRole) {
    throw new Error(`Rol no encontrado para admin seed: ${adminRoleCode}`);
  }

  await prisma.usuarioRol.createMany({
    data: [{ usuarioId: adminUser.id, rolId: adminRole.id }],
    skipDuplicates: true
  });
}

async function seedCatalogs() {
  for (const tipoDocumento of CATALOGO_TIPOS_DOCUMENTO) {
    await prisma.tipoDocumentoCatalogo.upsert({
      where: { code: tipoDocumento.code },
      update: {
        name: tipoDocumento.name,
        descripcion: tipoDocumento.descripcion,
        isActive: true
      },
      create: {
        code: tipoDocumento.code,
        name: tipoDocumento.name,
        descripcion: tipoDocumento.descripcion,
        isActive: true
      }
    });
  }

  for (const parametro of CATALOGO_PARAMETROS) {
    await prisma.catalogoParametro.upsert({
      where: { tipo_code: { tipo: parametro.tipo, code: parametro.code } },
      update: {
        name: parametro.name,
        sortOrder: parametro.sortOrder,
        isActive: true
      },
      create: {
        tipo: parametro.tipo,
        code: parametro.code,
        name: parametro.name,
        sortOrder: parametro.sortOrder,
        isActive: true
      }
    });
  }
}

type ValidationExpedienteSeed = {
  id: string;
  codigoInterno: string;
  estadoGlobal: EstadoExpedienteGlobal;
  etapas: Array<{
    tipoEtapa: TipoEtapa;
    estadoEtapa: EstadoEtapa;
  }>;
  blockingAlert?: {
    id: string;
    title: string;
    description: string;
  };
};

const VALIDATION_EXPEDIENTES: ValidationExpedienteSeed[] = [
  {
    id: "35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431",
    codigoInterno: "PAC-VERIF-001",
    estadoGlobal: EstadoExpedienteGlobal.CONTROL,
    etapas: [
      { tipoEtapa: TipoEtapa.REVISION_TECNICA, estadoEtapa: EstadoEtapa.CERRADA },
      { tipoEtapa: TipoEtapa.CONTROL_FINAL, estadoEtapa: EstadoEtapa.EN_PROGRESO }
    ]
  },
  {
    id: "b84fb315-bf65-40d4-86ff-6e4a52149965",
    codigoInterno: "PAC-VERIF-002",
    estadoGlobal: EstadoExpedienteGlobal.CONTROL,
    etapas: [{ tipoEtapa: TipoEtapa.REVISION_TECNICA, estadoEtapa: EstadoEtapa.EN_PROGRESO }],
    blockingAlert: {
      id: "f3d0a3e2-3d44-4b01-b2f4-bdf55aafb512",
      title: "Bloqueo de validacion QA",
      description: "Alerta de bloqueo activa para validar respuesta 422 en change-state."
    }
  },
  {
    id: "0bfc8a5f-c6df-4b54-a2ec-443d89f59dc8",
    codigoInterno: "PAC-VERIF-003",
    estadoGlobal: EstadoExpedienteGlobal.DOCUMENTAL,
    etapas: [{ tipoEtapa: TipoEtapa.CHECKLIST, estadoEtapa: EstadoEtapa.EN_PROGRESO }]
  }
];

async function seedM4ValidationDataset() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@pac.local";
  const adminUser = await prisma.usuario.findUnique({
    where: { email: adminEmail },
    select: { id: true }
  });

  if (!adminUser) {
    throw new Error("Usuario admin no encontrado para seed de validacion M4.");
  }

  for (const item of VALIDATION_EXPEDIENTES) {
    await prisma.expediente.upsert({
      where: { codigoInterno: item.codigoInterno },
      update: {
        estadoGlobal: item.estadoGlobal,
        nombreProyecto: `Dataset ${item.codigoInterno}`,
        profesionalResponsableId: adminUser.id,
        revisorAsignadoId: adminUser.id,
        updatedById: adminUser.id,
        deletedAt: null
      },
      create: {
        id: item.id,
        codigoInterno: item.codigoInterno,
        estadoGlobal: item.estadoGlobal,
        nombrePropietario: "Propietario Validacion M4",
        rutPropietario: `11.111.11${item.codigoInterno.slice(-1)}-K`,
        nombreProyecto: `Dataset ${item.codigoInterno}`,
        rolPredial: `ROL-${item.codigoInterno}`,
        region: "RM",
        provincia: "Santiago",
        comuna: "Santiago",
        superficieTotal: 120.5,
        numeroLotes: 3,
        numeroPlanosRecibidos: 2,
        presenciaKml: true,
        canalRecepcion: CanalRecepcion.PLATAFORMA_DIGITAL,
        prioridad: PrioridadExpediente.MEDIA,
        fechaRecepcion: new Date("2026-04-10T10:00:00.000Z"),
        profesionalResponsableId: adminUser.id,
        revisorAsignadoId: adminUser.id,
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    });

    for (const stage of item.etapas) {
      await prisma.expedienteEtapa.upsert({
        where: {
          expedienteId_tipoEtapa: {
            expedienteId: item.id,
            tipoEtapa: stage.tipoEtapa
          }
        },
        update: {
          estadoEtapa: stage.estadoEtapa,
          responsableUserId: adminUser.id
        },
        create: {
          expedienteId: item.id,
          tipoEtapa: stage.tipoEtapa,
          estadoEtapa: stage.estadoEtapa,
          responsableUserId: adminUser.id
        }
      });
    }

    if (item.blockingAlert) {
      await prisma.alerta.upsert({
        where: { id: item.blockingAlert.id },
        update: {
          status: EstadoAlerta.ACTIVA,
          blocking: true,
          title: item.blockingAlert.title,
          description: item.blockingAlert.description,
          severity: SeveridadAlerta.CRITICA,
          scopeType: ScopeType.EXPEDIENTE,
          originType: OrigenAlerta.MANUAL,
          expedienteId: item.id,
          responsibleUserId: adminUser.id
        },
        create: {
          id: item.blockingAlert.id,
          expedienteId: item.id,
          scopeType: ScopeType.EXPEDIENTE,
          originType: OrigenAlerta.MANUAL,
          severity: SeveridadAlerta.CRITICA,
          status: EstadoAlerta.ACTIVA,
          blocking: true,
          title: item.blockingAlert.title,
          description: item.blockingAlert.description,
          responsibleUserId: adminUser.id
        }
      });
    }
  }
}

async function main() {
  await seedRolesAndPermissions();
  await seedAdminUser();
  await seedCatalogs();
  await seedM4ValidationDataset();
  console.log("Seed completado: roles, permisos, usuario admin, catalogos base y dataset de validacion M4.");
}

main()
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
