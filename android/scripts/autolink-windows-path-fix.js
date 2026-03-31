#!/usr/bin/env node
/* global __dirname */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');
const hasNonAsciiProjectRoot = /[^\x00-\x7F]/.test(projectRoot);

function asText(value) {
  return typeof value === 'string' ? value : '';
}

function getShortPathWindows(targetPath) {
  const escapedPath = targetPath.replace(/"/g, '""');
  const cmd = `for %I in ("${escapedPath}") do @echo %~sI`;
  const result = spawnSync('cmd.exe', ['/d', '/s', '/c', cmd], { encoding: 'utf8' });
  if (result.status !== 0) {
    return null;
  }

  const lines = asText(result.stdout)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const shortPath = lines[lines.length - 1];
  if (!shortPath || shortPath.includes('"')) {
    return null;
  }

  const normalizedShort = shortPath.replace(/[\\/]+$/, '');
  const normalizedTarget = targetPath.replace(/[\\/]+$/, '');
  if (normalizedShort.toLowerCase() === normalizedTarget.toLowerCase()) {
    return null;
  }

  return shortPath;
}

function normalizeWindowsPath(targetPath) {
  const text = asText(targetPath).trim();
  if (!text) {
    return null;
  }

  const dequoted = text.replace(/^"(.*)"$/, '$1');
  return dequoted.replace(/[\\/]+$/, '');
}

function guessKnownShortPath(targetPath) {
  const candidates = [
    targetPath
      .replace('\\MasaÃ¼stÃ¼\\', '\\MASAST~1\\')
      .replace('\\HOLLAP VE ANTÄ° SLOT\\', '\\HOLLAP~1\\'),
    targetPath
      .replace('/MasaÃ¼stÃ¼/', '/MASAST~1/')
      .replace('/HOLLAP VE ANTÄ° SLOT/', '/HOLLAP~1/'),
  ];

  for (const candidate of candidates) {
    if (candidate !== targetPath && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function runAutolinkingConfig() {
  const shouldExcludeIapOnWindows =
    process.platform === 'win32' &&
    hasNonAsciiProjectRoot &&
    process.env.ANTISLOT_FORCE_INCLUDE_IAP !== '1';

  const extraArgs = shouldExcludeIapOnWindows ? ['--exclude', 'react-native-iap'] : [];

  return spawnSync(
    process.execPath,
    [
      '--no-warnings',
      '--eval',
      "require(require.resolve('expo-modules-autolinking', { paths: [require.resolve('expo/package.json')] }))(process.argv.slice(1))",
      'react-native-config',
      '--json',
      '--platform',
      'android',
      ...extraArgs,
    ],
    {
      cwd: projectRoot,
      encoding: 'utf8',
    }
  );
}

const result = runAutolinkingConfig();
if (result.status !== 0) {
  process.stderr.write(asText(result.stderr));
  process.exit(result.status ?? 1);
}

let output = asText(result.stdout);
if (process.platform === 'win32' && hasNonAsciiProjectRoot) {
  const shortRoot =
    normalizeWindowsPath(process.env.ANTISLOT_SHORT_ROOT) ||
    normalizeWindowsPath(guessKnownShortPath(projectRoot)) ||
    normalizeWindowsPath(getShortPathWindows(projectRoot));

  if (shortRoot && shortRoot !== projectRoot) {
    const longBackslash = projectRoot.replace(/\//g, '\\');
    const shortBackslash = shortRoot.replace(/\//g, '\\');

    const replacements = [
      [longBackslash, shortBackslash],
      [longBackslash.replace(/\\/g, '/'), shortBackslash.replace(/\\/g, '/')],
      [longBackslash.replace(/\\/g, '\\\\'), shortBackslash.replace(/\\/g, '\\\\')],
    ];

    for (const [from, to] of replacements) {
      if (from !== to) {
        output = output.split(from).join(to);
      }
    }
  }
}

process.stdout.write(output);
