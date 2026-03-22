#!/usr/bin/env node
/* eslint-disable no-console */

const { spawnSync } = require("child_process");

const CONFLICT_PATTERN = "^(<<<<<<<|=======|>>>>>>>)";
const DEFAULT_ARGS = [
  "--line-number",
  "--no-heading",
  "--hidden",
  "--glob",
  "!.git/**",
  "--glob",
  "!node_modules/**",
  "--glob",
  "!android/**",
  "--glob",
  "!ios/**",
  "--glob",
  "!**/package-lock.json",
  CONFLICT_PATTERN,
  ".",
];

function runSearch(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
}

function printAndFail(output) {
  console.error("[merge-check] FAIL: merge conflict marker(s) found:");
  console.error(output.trim());
  process.exit(1);
}

function printAndPass() {
  console.log("[merge-check] OK: no merge conflict markers found.");
}

function run() {
  const rg = runSearch("rg", DEFAULT_ARGS);

  if (!rg.error) {
    if (rg.status === 0) {
      printAndFail(rg.stdout);
    }
    if (rg.status === 1) {
      printAndPass();
      return;
    }
    console.error("[merge-check] ERROR: ripgrep failed.");
    console.error((rg.stderr || rg.stdout || "").trim());
    process.exit(rg.status || 2);
  }

  const git = runSearch("git", ["grep", "-nE", CONFLICT_PATTERN, "--", "."]);
  if (!git.error) {
    if (git.status === 0) {
      printAndFail(git.stdout);
    }
    if (git.status === 1) {
      printAndPass();
      return;
    }
    console.error("[merge-check] ERROR: git grep failed.");
    console.error((git.stderr || git.stdout || "").trim());
    process.exit(git.status || 2);
  }

  console.error("[merge-check] ERROR: neither 'rg' nor 'git grep' could run.");
  process.exit(2);
}

run();
