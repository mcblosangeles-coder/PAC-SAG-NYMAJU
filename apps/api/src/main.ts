import "dotenv/config";
import { env } from "./lib/env";
import { createApp } from "./app";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { assertRedisConnectivity, connectRedis, disconnectRedis } from "./lib/redis";
import { operationalAlertsService } from "./modules/metrics/operational-alerts.service";
import { metricsHistoryService } from "./modules/metrics/metrics-history.service";

const app = createApp();
const port = env.port;
const apiPrefix = env.apiPrefix;

let server: ReturnType<typeof app.listen> | null = null;

const shutdown = async (signal: string): Promise<void> => {
  logger.info("http.server.stopping", "API server stopping.", { signal });
  operationalAlertsService.stopEvaluator();
  metricsHistoryService.stopCollector();
  if (!server) {
    await disconnectRedis();
    await prisma.$disconnect();
    process.exit(0);
    return;
  }

  server.close(async () => {
    await disconnectRedis();
    await prisma.$disconnect();
    logger.info("http.server.stopped", "API server stopped.", { signal });
    process.exit(0);
  });
};

const bootstrapSecurityDependencies = async (): Promise<void> => {
  if (!env.rateLimitEnabled || env.rateLimitStore !== "redis") return;

  if (env.rateLimitRequireRedis) {
    await assertRedisConnectivity();
    logger.info("security.rate_limit.redis_connected", "Redis connectivity validated for distributed rate limiting.");
    return;
  }

  try {
    await connectRedis();
    logger.info("security.rate_limit.redis_connected", "Redis connected for distributed rate limiting.");
  } catch (error) {
    logger.warn("security.rate_limit.redis_optional_unavailable", "Redis unavailable; runtime fallback may be used.", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
  }
};

const startServer = async (): Promise<void> => {
  await bootstrapSecurityDependencies();
  server = app.listen(port, () => {
    metricsHistoryService.startCollector();
    operationalAlertsService.startEvaluator();
    logger.info("http.server.started", "API server started.", {
      port,
      apiPrefix,
      healthUrl: `http://localhost:${port}${apiPrefix}/health`
    });
  });
};

void startServer().catch(async (error) => {
  logger.error("http.server.bootstrap_failed", "API server bootstrap failed.", error);
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
