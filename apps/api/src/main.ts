import "dotenv/config";
import { env } from "./lib/env";
import { createApp } from "./app";

const app = createApp();
const port = env.port;
const apiPrefix = env.apiPrefix;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}${apiPrefix}/health`);
});
