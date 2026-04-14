export type HealthStatus = {
  service: string;
  status: "ok" | "degraded" | "down";
  timestamp: string;
};
