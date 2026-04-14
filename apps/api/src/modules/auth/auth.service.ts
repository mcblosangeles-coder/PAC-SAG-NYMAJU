import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import type { Prisma } from "@prisma/client";
import { env } from "../../lib/env";
import { prisma } from "../../lib/prisma";
import { auditService } from "../audit/audit.service";
import {
  sessionService
} from "./session.service";
import type {
  AuthTokens,
  AuthUserProfile,
  IssuedRefreshToken,
  JwtTokenPayload,
  LoginInput,
  RefreshInput,
  RefreshJwtTokenPayload
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

type LogoutInput = {
  refreshToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

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

const signRefreshToken = (payload: RefreshJwtTokenPayload): string =>
  jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"]
  });

const decodeRefreshExpiration = (token: string): Date => {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded || typeof decoded.exp !== "number") {
    throw new AuthError("No fue posible determinar expiracion de refresh token.", 500);
  }
  return new Date(decoded.exp * 1000);
};

const validateRefreshPayload = (payload: unknown): RefreshJwtTokenPayload => {
  if (!payload || typeof payload !== "object") {
    throw new AuthError("Refresh token invalido o expirado.", 401);
  }

  const candidate = payload as Partial<RefreshJwtTokenPayload>;
  if (candidate.type !== "refresh") {
    throw new AuthError("Refresh token invalido o expirado.", 401);
  }
  if (typeof candidate.sub !== "string" || candidate.sub.trim().length === 0) {
    throw new AuthError("Refresh token invalido o expirado.", 401);
  }
  if (typeof candidate.jti !== "string" || candidate.jti.trim().length === 0) {
    throw new AuthError("Refresh token invalido o expirado.", 401);
  }
  if (typeof candidate.family !== "string" || candidate.family.trim().length === 0) {
    throw new AuthError("Refresh token invalido o expirado.", 401);
  }
  if (typeof candidate.exp !== "number") {
    throw new AuthError("Refresh token invalido o expirado.", 401);
  }

  return {
    sub: candidate.sub.trim(),
    jti: candidate.jti.trim(),
    family: candidate.family.trim(),
    type: "refresh",
    iat: candidate.iat,
    exp: candidate.exp
  };
};

const issueRefreshToken = (userId: string, family?: string): IssuedRefreshToken => {
  const payload: RefreshJwtTokenPayload = {
    sub: userId,
    jti: randomUUID(),
    family: family ?? randomUUID(),
    type: "refresh"
  };

  const token = signRefreshToken(payload);
  const expiresAt = decodeRefreshExpiration(token);

  return {
    token,
    payload,
    expiresAt
  };
};

const auditAuthEvent = async (input: {
  action: string;
  userId?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  comment?: string | null;
  metadata?: Prisma.InputJsonValue;
}) => {
  await auditService.safeLog({
    usuarioId: normalizeText(input.userId),
    accion: input.action,
    entityType: input.entityId ? "USUARIO" : "SISTEMA",
    entityId: input.entityId ?? "SYSTEM",
    ipAddress: normalizeText(input.ipAddress),
    comentario: normalizeText(input.comment),
    metadata: input.metadata
  });
};

const issueTokens = (
  profile: AuthUserProfile,
  refreshToken: IssuedRefreshToken
): AuthTokens => ({
  accessToken: signAccessToken({
    sub: profile.id,
    email: profile.email,
    roles: profile.roles,
    permissions: profile.permissions
  }),
  refreshToken: refreshToken.token,
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
  async login(
    input: LoginInput & { ipAddress?: string | null; userAgent?: string | null }
  ): Promise<{ user: AuthUserProfile; tokens: AuthTokens }> {
    const email = normalizeEmail(input.email);
    const user = await findUserByEmail(email);

    if (!user) {
      await auditAuthEvent({
        action: "auth.login_failed",
        ipAddress: input.ipAddress,
        comment: "email_not_found",
        metadata: { email }
      });
      throw new AuthError("Credenciales invalidas.", 401);
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      await auditAuthEvent({
        action: "auth.login_failed",
        userId: user.id,
        entityId: user.id,
        ipAddress: input.ipAddress,
        comment: "invalid_password"
      });
      throw new AuthError("Credenciales invalidas.", 401);
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const profile = mapUserSecurityContext(user);
    const issuedRefreshToken = issueRefreshToken(profile.id);

    await sessionService.createSession({
      userId: profile.id,
      refreshToken: issuedRefreshToken.token,
      tokenFamily: issuedRefreshToken.payload.family,
      expiresAt: issuedRefreshToken.expiresAt,
      createdByIp: normalizeText(input.ipAddress),
      userAgent: normalizeText(input.userAgent)
    });

    await sessionService.enforceSessionLimit(profile.id);

    const tokens = issueTokens(profile, issuedRefreshToken);
    await auditAuthEvent({
      action: "auth.login",
      userId: profile.id,
      entityId: profile.id,
      ipAddress: input.ipAddress,
      metadata: { sessionFamily: issuedRefreshToken.payload.family }
    });
    return { user: profile, tokens };
  },

  async refresh(input: RefreshInput): Promise<AuthTokens> {
    let payload: RefreshJwtTokenPayload;
    try {
      payload = validateRefreshPayload(jwt.verify(input.refreshToken, env.jwtRefreshSecret));
    } catch (error) {
      await auditAuthEvent({
        action: "auth.refresh_failed",
        ipAddress: input.ipAddress,
        comment: "invalid_signature_or_claims"
      });
      if (error instanceof AuthError) throw error;
      throw new AuthError("Refresh token invalido o expirado.", 401);
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      await auditAuthEvent({
        action: "auth.refresh_failed",
        userId: payload.sub,
        entityId: payload.sub,
        ipAddress: input.ipAddress,
        comment: "user_not_found"
      });
      throw new AuthError("Usuario no encontrado o inactivo.", 401);
    }

    const profile = mapUserSecurityContext(user);
    const newRefreshToken = issueRefreshToken(profile.id, payload.family);
    const rotation = await sessionService.rotateSession({
      currentRefreshToken: input.refreshToken,
      newRefreshToken: newRefreshToken.token,
      newTokenFamily: payload.family,
      expiresAt: newRefreshToken.expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    });

    if (rotation.status === "not_found") {
      await auditAuthEvent({
        action: "auth.refresh_failed",
        userId: payload.sub,
        entityId: payload.sub,
        ipAddress: input.ipAddress,
        comment: "session_not_found"
      });
      throw new AuthError("Refresh token invalido o expirado.", 401);
    }
    if (rotation.status === "expired") {
      await auditAuthEvent({
        action: "auth.refresh_failed",
        userId: payload.sub,
        entityId: payload.sub,
        ipAddress: input.ipAddress,
        comment: "session_expired"
      });
      throw new AuthError("Refresh token invalido o expirado.", 401);
    }
    if (rotation.status === "inactive") {
      await auditAuthEvent({
        action: "auth.refresh_replay_detected",
        userId: payload.sub,
        entityId: payload.sub,
        ipAddress: input.ipAddress,
        comment: "rotated_or_revoked_token_reused",
        metadata: { tokenFamily: payload.family }
      });
      throw new AuthError("Refresh token reutilizado o revocado.", 401);
    }

    await auditAuthEvent({
      action: "auth.refresh",
      userId: payload.sub,
      entityId: payload.sub,
      ipAddress: input.ipAddress,
      metadata: { tokenFamily: payload.family }
    });
    return issueTokens(profile, newRefreshToken);
  },

  async me(userId: string): Promise<AuthUserProfile> {
    const user = await findUserById(userId);
    if (!user) {
      throw new AuthError("Usuario no encontrado o inactivo.", 404);
    }
    return mapUserSecurityContext(user);
  },

  async logout(input?: LogoutInput): Promise<void> {
    const refreshToken = normalizeText(input?.refreshToken);
    if (!refreshToken) {
      return;
    }

    let logoutPayload: RefreshJwtTokenPayload;
    try {
      logoutPayload = validateRefreshPayload(
        jwt.verify(refreshToken, env.jwtRefreshSecret, { ignoreExpiration: true })
      );
      if (logoutPayload.type !== "refresh") {
        throw new AuthError("Refresh token invalido.", 401);
      }
    } catch (error) {
      await auditAuthEvent({
        action: "auth.logout_failed",
        ipAddress: input?.ipAddress,
        comment: "invalid_refresh_token"
      });
      if (error instanceof AuthError) throw error;
      throw new AuthError("Refresh token invalido.", 401);
    }

    await sessionService.revokeByRefreshToken({
      refreshToken,
      revokeReason: "logout",
      revokedByIp: input?.ipAddress
    });

    await auditAuthEvent({
      action: "auth.logout",
      userId: logoutPayload.sub,
      entityId: logoutPayload.sub,
      ipAddress: input?.ipAddress
    });
  }
};
