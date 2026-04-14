import "dotenv/config";
import { env } from "./lib/env";
import { createApp } from "./app";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { operationalAlertsService } from "./modules/metrics/operational-alerts.service";
import { metricsHistoryService } from "./modules/metrics/metrics-history.service";

const app = createApp();
const port = env.port;
const apiPrefix = env.apiPrefix;

const server = app.listen(port, () => {
  metricsHistoryService.startCollector();
  operationalAlertsService.startEvaluator();
  logger.info("http.server.started", "API server started.", {
    port,
    apiPrefix,
    healthUrl: `http://localhost:${port}${apiPrefix}/health`
  });
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info("http.server.stopping", "API server stopping.", { signal });
  operationalAlertsService.stopEvaluator();
  metricsHistoryService.stopCollector();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("http.server.stopped", "API server stopped.", { signal });
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
