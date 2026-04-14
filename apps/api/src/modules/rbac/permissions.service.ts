import { prisma } from "../../lib/prisma";

export type UserSecurityContext = {
  userId: string;
  roles: string[];
  permissions: string[];
};

const toUnique = (items: string[]): string[] => [...new Set(items)];

export const permissionsService = {
  async getUserSecurityContext(userId: string): Promise<UserSecurityContext | null> {
    const user = await prisma.usuario.findFirst({
      where: {
        id: userId,
        isActive: true,
        deletedAt: null
      },
      include: {
        userRoles: {
          include: {
            rol: {
              include: {
                rolePermisos: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) return null;

    const roles = toUnique(user.userRoles.map((ur) => ur.rol.code));
    const permissions = toUnique(
      user.userRoles.flatMap((ur) => ur.rol.rolePermisos.map((rp) => rp.permiso.code))
    );

    return { userId: user.id, roles, permissions };
  },

  async getUserPermissions(userId: string): Promise<string[]> {
    const context = await this.getUserSecurityContext(userId);
    return context?.permissions ?? [];
  },

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionCode);
  }
};
