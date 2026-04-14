import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../../lib/env";
import { prisma } from "../../lib/prisma";
import type {
  AuthTokens,
  AuthUserProfile,
  JwtTokenPayload,
  LoginInput,
  RefreshInput
} from "./auth.types";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const mapUserSecurityContext = (user: {
  id: string;
  email: string;
  fullName: string;
  initials: string | null;
  userRoles: Array<{
    rol: {
      code: string;
      rolePermisos: Array<{
        permiso: {
          code: string;
        };
      }>;
    };
  }>;
}): AuthUserProfile => {
  const roles = [...new Set(user.userRoles.map((ur) => ur.rol.code))];
  const permissions = [
    ...new Set(
      user.userRoles.flatMap((ur) => ur.rol.rolePermisos.map((rp) => rp.permiso.code))
    )
  ];

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    initials: user.initials,
    roles,
    permissions
  };
};

const signAccessToken = (payload: JwtTokenPayload): string =>
  jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"]
  });

const signRefreshToken = (payload: JwtTokenPayload): string =>
  jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"]
  });

const issueTokens = (payload: JwtTokenPayload): AuthTokens => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
  tokenType: "Bearer",
  expiresIn: env.jwtAccessExpiresIn
});

const findUserByEmail = async (email: string) =>
  prisma.usuario.findFirst({
    where: {
      email,
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

const findUserById = async (userId: string) =>
  prisma.usuario.findFirst({
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

export const authService = {
  async login(input: LoginInput): Promise<{ user: AuthUserProfile; tokens: AuthTokens }> {
    const email = normalizeEmail(input.email);
    const user = await findUserByEmail(email);

    if (!user) {
      throw new AuthError("Credenciales inválidas.", 401);
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError("Credenciales inválidas.", 401);
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const profile = mapUserSecurityContext(user);
    const tokens = issueTokens({
      sub: profile.id,
      email: profile.email,
      roles: profile.roles,
      permissions: profile.permissions
    });

    return { user: profile, tokens };
  },

  async refresh(input: RefreshInput): Promise<AuthTokens> {
    let payload: JwtTokenPayload;
    try {
      payload = jwt.verify(input.refreshToken, env.jwtRefreshSecret) as JwtTokenPayload;
    } catch {
      throw new AuthError("Refresh token inválido o expirado.", 401);
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      throw new AuthError("Usuario no encontrado o inactivo.", 401);
    }

    const profile = mapUserSecurityContext(user);
    return issueTokens({
      sub: profile.id,
      email: profile.email,
      roles: profile.roles,
      permissions: profile.permissions
    });
  },

  async me(userId: string): Promise<AuthUserProfile> {
    const user = await findUserById(userId);
    if (!user) {
      throw new AuthError("Usuario no encontrado o inactivo.", 404);
    }
    return mapUserSecurityContext(user);
  },

  async logout(): Promise<void> {
    // Stateless logout para JWT en etapa inicial.
    // La invalidación activa se implementará cuando se incorpore store de refresh tokens.
  }
};
