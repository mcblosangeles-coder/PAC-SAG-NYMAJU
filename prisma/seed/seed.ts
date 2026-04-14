import { PrismaClient } from "@prisma/client";
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

async function main() {
  await seedRolesAndPermissions();
  await seedAdminUser();
  await seedCatalogs();
  console.log("Seed completado: roles, permisos, usuario admin y catálogos base.");
}

main()
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
