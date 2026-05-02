const path = require("path");
const fs = require("fs");

const envFile = path.join(__dirname, ".env");
const fallbackEnvFile = path.join(__dirname, ".env.local");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (!key) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

const fileEnv = {
  ...parseEnvFile(fallbackEnvFile),
  ...parseEnvFile(envFile),
};

const baseEnv = {
  ...fileEnv,
  PORT: fileEnv.PORT || "3000",
};

module.exports = {
  apps: [
    {
      name: "antislot-backend-api",
      cwd: ".",
      env_file: envFile,
      script: "node",
      args: "dist/server.js",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      env: {
        ...baseEnv,
        NODE_ENV: "development",
      },
      env_production: {
        ...baseEnv,
        NODE_ENV: "production",
      },
    },
    {
      name: "antislot-telegram-worker",
      cwd: ".",
      env_file: envFile,
      script: "node",
      args: "dist/scripts/telegram-ingest-worker.js",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      watch: false,
      env: {
        ...baseEnv,
        NODE_ENV: "development",
        TELEGRAM_WORKER_CONTINUOUS: "true",
      },
      env_production: {
        ...baseEnv,
        NODE_ENV: "production",
        TELEGRAM_WORKER_CONTINUOUS: "true",
      },
    },
  ],
};
