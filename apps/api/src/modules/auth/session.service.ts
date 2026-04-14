import { createHmac } from "node:crypto";
import type { Prisma, UserSession } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";

type CreateSessionInput = {
  userId: string;
  refreshToken: string;
  tokenFamily: string;
  expiresAt: Date;
  parentSessionId?: string | null;
  createdByIp?: string | null;
  userAgent?: string | null;
};

type RotateSessionInput = {
  currentRefreshToken: string;
  newRefreshToken: string;
  newTokenFamily: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type RotateSessionResult =
  | {
      status: "rotated";
      newSession: UserSession;
      previousSession: UserSession;
    }
  | {
      status: "not_found" | "expired" | "inactive";
      previousSession: UserSession | null;
    };

type RevokeByTokenInput = {
  refreshToken: string;
  revokeReason: string;
  revokedByIp?: string | null;
};

const normalizeText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const hashRefreshToken = (token: string): string =>
  createHmac("sha256", env.jwtRefreshSecret).update(token).digest("hex");

const revokeFamily = async (
  tx: Prisma.TransactionClient,
  tokenFamily: string,
  revokeReason: string,
  revokedByIp?: string | null
) => {
  const now = new Date();
  const ipAddress = normalizeText(revokedByIp);

  await tx.userSession.updateMany({
    where: {
      tokenFamily,
      isActive: true
    },
    data: {
      isActive: false,
      revokedAt: now,
      revokeReason,
      revokedByIp: ipAddress
    }
  });
};

export const sessionService = {
  hashRefreshToken,

  async createSession(input: CreateSessionInput): Promise<UserSession> {
    return prisma.userSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: hashRefreshToken(input.refreshToken),
        tokenFamily: input.tokenFamily,
        parentSessionId: input.parentSessionId ?? null,
        expiresAt: input.expiresAt,
        createdByIp: normalizeText(input.createdByIp),
        userAgent: normalizeText(input.userAgent),
        isActive: true
      }
    });
  },

  async rotateSession(input: RotateSessionInput): Promise<RotateSessionResult> {
    const now = new Date();
    const currentHash = hashRefreshToken(input.currentRefreshToken);
    const newHash = hashRefreshToken(input.newRefreshToken);
    const ipAddress = normalizeText(input.ipAddress);
    const userAgent = normalizeText(input.userAgent);

    return prisma.$transaction(async (tx) => {
      const current = await tx.userSession.findUnique({
        where: {
          refreshTokenHash: currentHash
        }
      });

      if (!current) {
        return {
          status: "not_found",
          previousSession: null
        };
      }

      const isExpired = current.expiresAt.getTime() <= now.getTime();
      if (isExpired) {
        if (current.isActive) {
          await tx.userSession.update({
            where: { id: current.id },
            data: {
              isActive: false,
              revokedAt: now,
              revokeReason: "expired",
              revokedByIp: ipAddress
            }
          });
        }

        return {
          status: "expired",
          previousSession: current
        };
      }

      if (!current.isActive || current.revokedAt) {
        await revokeFamily(tx, current.tokenFamily, "replay_detected", ipAddress);

        return {
          status: "inactive",
          previousSession: current
        };
      }

      const newSession = await tx.userSession.create({
        data: {
          userId: current.userId,
          refreshTokenHash: newHash,
          tokenFamily: input.newTokenFamily,
          parentSessionId: current.id,
          expiresAt: input.expiresAt,
          createdByIp: ipAddress,
          userAgent
        }
      });

      const previousSession = await tx.userSession.update({
        where: { id: current.id },
        data: {
          replacedBySessionId: newSession.id,
          isActive: false,
          revokedAt: now,
          revokeReason: "rotated",
          revokedByIp: ipAddress,
          lastUsedAt: now,
          lastUsedByIp: ipAddress
        }
      });

      return {
        status: "rotated",
        newSession,
        previousSession
      };
    });
  },

  async revokeByRefreshToken(input: RevokeByTokenInput): Promise<void> {
    const tokenHash = hashRefreshToken(input.refreshToken);
    const now = new Date();
    const ipAddress = normalizeText(input.revokedByIp);

    await prisma.$transaction(async (tx) => {
      const session = await tx.userSession.findUnique({
        where: {
          refreshTokenHash: tokenHash
        }
      });

      if (!session) return;
      if (!session.isActive) return;

      await tx.userSession.update({
        where: { id: session.id },
        data: {
          isActive: false,
          revokedAt: now,
          revokeReason: input.revokeReason,
          revokedByIp: ipAddress
        }
      });
    });
  },

  async enforceSessionLimit(userId: string, maxActiveSessions = 5): Promise<void> {
    if (maxActiveSessions <= 0) return;

    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (activeSessions.length <= maxActiveSessions) return;

    const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - maxActiveSessions);
    const sessionIds = sessionsToRevoke.map((session) => session.id);

    await prisma.userSession.updateMany({
      where: {
        id: {
          in: sessionIds
        }
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: "session_limit_exceeded"
      }
    });
  }
};
