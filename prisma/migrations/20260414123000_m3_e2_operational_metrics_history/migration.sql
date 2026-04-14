-- M3-E2: Persistencia historica de metricas operativas
CREATE TABLE "operational_metric_snapshots" (
  "id" TEXT NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'api_internal',
  "requests_total" INTEGER NOT NULL DEFAULT 0,
  "requests_error_total" INTEGER NOT NULL DEFAULT 0,
  "requests_5xx_total" INTEGER NOT NULL DEFAULT 0,
  "auth_refresh_attempts" INTEGER NOT NULL DEFAULT 0,
  "auth_refresh_failures" INTEGER NOT NULL DEFAULT 0,
  "workflow_change_attempts" INTEGER NOT NULL DEFAULT 0,
  "workflow_422_total" INTEGER NOT NULL DEFAULT 0,
  "audit_log_failed_count" INTEGER NOT NULL DEFAULT 0,
  "p95_latency_ms" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "error_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "auth_refresh_failed_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "workflow_422_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operational_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operational_metric_snapshots_source_window_start_key"
  ON "operational_metric_snapshots"("source", "window_start");

CREATE INDEX "operational_metric_snapshots_window_start_window_end_idx"
  ON "operational_metric_snapshots"("window_start", "window_end");

CREATE INDEX "operational_metric_snapshots_window_end_idx"
  ON "operational_metric_snapshots"("window_end");
