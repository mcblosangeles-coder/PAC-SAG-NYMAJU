import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

process.env.NODE_ENV = "test";
process.env.API_PREFIX = "/api/v1";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://pac_user:pac_password@localhost:5432/pac_nymaju_spr?schema=public";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret";
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

const TEST_USER_EMAIL = "m3b3.session@pac.local";
const TEST_USER_PASSWORD = "M3B3_Session_123!";

const login = async (baseUrl: string) =>
  fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "m3b3-e2e-client" },
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    })
  });

const refresh = async (baseUrl: string, refreshToken: string) =>
  fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "m3b3-e2e-client" },
    body: JSON.stringify({ refreshToken })
  });

const logout = async (baseUrl: string, refreshToken: string) =>
  fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "m3b3-e2e-client" },
    body: JSON.stringify({ refreshToken })
  });

describe("Auth session security (M3-B3)", async () => {
  const { createApp } = await import("../app");
  const app = createApp();

  let server: http.Server;
  let baseUrl = "";
  let testUserId = "";

  before(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.on("listening", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to start test server.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);

    const user = await prisma.usuario.upsert({
      where: { email: TEST_USER_EMAIL },
      update: {
        passwordHash,
        isActive: true,
        deletedAt: null
      },
      create: {
        email: TEST_USER_EMAIL,
        passwordHash,
        fullName: "M3-B3 Session User",
        isActive: true
      }
    });

    testUserId = user.id;

    await prisma.userSession.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.auditLog.deleteMany({
      where: {
        OR: [{ userId: testUserId }, { accion: { startsWith: "auth." } }]
      }
    });
  });

  it("rotates refresh token, detects replay and revokes token family", async () => {
    const loginResponse = await login(baseUrl);
    assert.equal(loginResponse.status, 200);
    const loginBody = (await loginResponse.json()) as {
      tokens: { refreshToken: string };
    };
    const refreshToken1 = loginBody.tokens.refreshToken;
    const decodedRefresh1 = jwt.decode(refreshToken1) as { family?: string } | null;
    const tokenFamily = decodedRefresh1?.family;
    assert.equal(typeof tokenFamily, "string");

    const refreshResponse = await refresh(baseUrl, refreshToken1);
    assert.equal(refreshResponse.status, 200);
    const refreshBody = (await refreshResponse.json()) as { refreshToken: string };
    const refreshToken2 = refreshBody.refreshToken;

    const replayResponse = await refresh(baseUrl, refreshToken1);
    assert.equal(replayResponse.status, 401);
    const replayBody = (await replayResponse.json()) as { code?: string };
    assert.equal(replayBody.code, "UNAUTHENTICATED");

    const familyRevokedResponse = await refresh(baseUrl, refreshToken2);
    assert.equal(familyRevokedResponse.status, 401);

    const activeFamilySessions = await prisma.userSession.count({
      where: {
        tokenFamily: tokenFamily as string,
        isActive: true
      }
    });
    assert.equal(activeFamilySessions, 0);

    const auditActions = await prisma.auditLog.findMany({
      where: { userId: testUserId, accion: { startsWith: "auth." } },
      select: { accion: true }
    });
    const actions = new Set(auditActions.map((entry) => entry.accion));
    assert.equal(actions.has("auth.login"), true);
    assert.equal(actions.has("auth.refresh"), true);
    assert.equal(actions.has("auth.refresh_replay_detected"), true);
  });

  it("logout is idempotent and revoked refresh cannot be used again", async () => {
    const loginResponse = await login(baseUrl);
    assert.equal(loginResponse.status, 200);
    const loginBody = (await loginResponse.json()) as {
      tokens: { refreshToken: string };
    };
    const refreshToken = loginBody.tokens.refreshToken;

    const logoutResponse1 = await logout(baseUrl, refreshToken);
    assert.equal(logoutResponse1.status, 204);

    const logoutResponse2 = await logout(baseUrl, refreshToken);
    assert.equal(logoutResponse2.status, 204);

    const refreshAfterLogoutResponse = await refresh(baseUrl, refreshToken);
    assert.equal(refreshAfterLogoutResponse.status, 401);

    const logoutAuditCount = await prisma.auditLog.count({
      where: {
        userId: testUserId,
        accion: "auth.logout"
      }
    });
    assert.equal(logoutAuditCount >= 1, true);
  });

  it("returns 401 on logout with malformed token", async () => {
    const response = await logout(baseUrl, "bad.token.value");
    assert.equal(response.status, 401);
    const body = (await response.json()) as { code?: string };
    assert.equal(body.code, "UNAUTHENTICATED");
  });
});
