#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null,
  };
}

function ensureBinary(name) {
  const check = run(name, ["--version"]);
  if (check.error || check.status !== 0) {
    throw new Error(`${name} is not available. Install PostgreSQL client tools first.`);
  }
}

function main() {
  const databaseUrl = (process.env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    console.error("[backup-drill] DATABASE_URL is required.");
    process.exit(1);
  }

  const restoreDbUrl = (process.env.BACKUP_DRILL_RESTORE_DB_URL || "").trim();
  const backupDir = path.resolve(
    process.cwd(),
    process.env.BACKUP_DRILL_DIR || "./data/backup-drill"
  );
  fs.mkdirSync(backupDir, { recursive: true });

  const dumpFile = path.join(backupDir, `premium-backup-${timestampSlug()}.dump`);

  try {
    ensureBinary("pg_dump");
    ensureBinary("pg_restore");

    const dump = run(
      "pg_dump",
      ["--format=custom", "--no-owner", "--no-privileges", "--file", dumpFile, databaseUrl],
      { env: process.env }
    );

    if (dump.status !== 0) {
      throw new Error(`[backup-drill] pg_dump failed: ${dump.stderr || dump.stdout}`);
    }

    const stat = fs.statSync(dumpFile);
    if (!stat.size) {
      throw new Error("[backup-drill] Backup file was created but empty.");
    }

    const verify = run("pg_restore", ["--list", dumpFile], { env: process.env });
    if (verify.status !== 0) {
      throw new Error(`[backup-drill] pg_restore --list failed: ${verify.stderr || verify.stdout}`);
    }

    let restoreResult = "skipped";
    if (restoreDbUrl) {
      const restore = run(
        "pg_restore",
        ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--dbname", restoreDbUrl, dumpFile],
        { env: process.env }
      );

      if (restore.status !== 0) {
        throw new Error(`[backup-drill] pg_restore failed: ${restore.stderr || restore.stdout}`);
      }
      restoreResult = "executed";
    }

    console.log(
      JSON.stringify(
        {
          status: "pass",
          backupFile: dumpFile,
          backupSizeBytes: stat.size,
          restoreResult,
          checkedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          status: "fail",
          reason: error instanceof Error ? error.message : String(error),
          checkedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

main();
