-- CreateEnum
CREATE TYPE "OperationalAlertActionType" AS ENUM ('ACKNOWLEDGE', 'SILENCE', 'UNSILENCE');

-- CreateEnum
CREATE TYPE "OperationalAlertEventType" AS ENUM ('TRIGGERED', 'ONGOING', 'RESOLVED', 'ACKNOWLEDGED', 'SILENCED', 'UNSILENCED');

-- CreateTable
CREATE TABLE "operational_alert_actions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "action_type" "OperationalAlertActionType" NOT NULL,
    "comment" TEXT,
    "silenced_until" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "operator" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_alert_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_alert_events" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "event_type" "OperationalAlertEventType" NOT NULL,
    "severity" TEXT,
    "metric" TEXT,
    "value" DECIMAL(12,4),
    "threshold" TEXT,
    "payload" JSONB,
    "created_by_user_id" TEXT,
    "operator" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operational_alert_actions_rule_id_created_at_idx" ON "operational_alert_actions"("rule_id", "created_at");

-- CreateIndex
CREATE INDEX "operational_alert_actions_action_type_created_at_idx" ON "operational_alert_actions"("action_type", "created_at");

-- CreateIndex
CREATE INDEX "operational_alert_events_rule_id_created_at_idx" ON "operational_alert_events"("rule_id", "created_at");

-- CreateIndex
CREATE INDEX "operational_alert_events_event_type_created_at_idx" ON "operational_alert_events"("event_type", "created_at");
