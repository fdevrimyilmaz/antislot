const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const projectRootPattern = escapeRegExp(path.resolve(__dirname));

// Keep Metro focused on the mobile app tree. Large generated and backend folders
// can trigger noisy file-watcher churn on Windows and destabilize the dev graph.
const ignoredProjectEntries = new RegExp(
  `^${projectRootPattern}[\\\\/](?:backend|coverage|dist(?:-[^\\\\/]+)?|docs|reports|server|store-metadata|website)(?:[\\\\/].*)?$`
);
const ignoredTemporaryFiles = new RegExp(
  `^${projectRootPattern}[\\\\/]\\.tmp-[^\\\\/]+$`
);

config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  ignoredProjectEntries,
  ignoredTemporaryFiles,
];

module.exports = config;
