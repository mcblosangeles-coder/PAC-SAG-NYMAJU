-- M5-F2: profile signal hardening for operational metrics
ALTER TABLE "operational_metric_snapshots"
ADD COLUMN "requests_profile_header_valid_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "requests_profile_header_missing_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "requests_profile_header_invalid_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "profile_header_valid_rate" DECIMAL(8,4) NOT NULL DEFAULT 0;
