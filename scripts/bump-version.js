const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function bumpSemver(version, level) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid version: ${version}`);
  }
  let [major, minor, patch] = match.slice(1).map((v) => parseInt(v, 10));
  if (level === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (level === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

const levelArg = process.argv.find((arg) => arg.startsWith("--"));
const level = levelArg ? levelArg.replace(/^--/, "") : "patch";
if (!["major", "minor", "patch"].includes(level)) {
  console.error("Usage: node scripts/bump-version.js [--major|--minor|--patch]");
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");
const packagePath = path.join(repoRoot, "package.json");
const appJsonPath = path.join(repoRoot, "app.json");

const pkg = readJson(packagePath);
const appJson = readJson(appJsonPath);

const nextVersion = bumpSemver(pkg.version, level);
pkg.version = nextVersion;

if (!appJson.expo) {
  appJson.expo = {};
}
appJson.expo.version = nextVersion;

const currentVersionCode = Number(appJson.expo.android?.versionCode ?? 0);
const nextVersionCode = Number.isFinite(currentVersionCode) ? currentVersionCode + 1 : 1;
appJson.expo.android = {
  ...(appJson.expo.android || {}),
  versionCode: nextVersionCode,
};

const currentBuildNumber = parseInt(String(appJson.expo.ios?.buildNumber ?? "0"), 10);
const nextBuildNumber = Number.isFinite(currentBuildNumber) ? currentBuildNumber + 1 : 1;
appJson.expo.ios = {
  ...(appJson.expo.ios || {}),
  buildNumber: String(nextBuildNumber),
};

writeJson(packagePath, pkg);
writeJson(appJsonPath, appJson);

console.log(`Version bumped to ${nextVersion}`);
console.log(`Android versionCode: ${nextVersionCode}`);
console.log(`iOS buildNumber: ${nextBuildNumber}`);
