const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');

const expoRoot = path.dirname(require.resolve('expo/package.json'));
const expoCli = path.join(expoRoot, 'bin', 'cli');
const requiredFirebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
];
const metroStartupStateFile = path.resolve(process.cwd(), '.expo', 'metro-start-state.json');
const metroSignatureFiles = [
  'package.json',
  'package-lock.json',
  'app.json',
  'babel.config.js',
  'metro.config.js',
  'tsconfig.json',
];
const metroSignatureDirectories = [
  'app',
  'components',
  'constants',
  'contexts',
  'data',
  'hooks',
  'i18n',
  'lib',
  'services',
  'store',
  'types',
];
const metroTempPrefixes = ['metro-', 'haste-map-'];

const userArgs = process.argv.slice(2);

const removeFlag = (args, flag) => {
  let index = args.indexOf(flag);
  while (index !== -1) {
    args.splice(index, 1);
    index = args.indexOf(flag);
  }
};

const requestedNonInteractive = userArgs.includes('--non-interactive');
if (requestedNonInteractive) {
  removeFlag(userArgs, '--non-interactive');
  console.warn(
    '[expo-start] `--non-interactive` is not supported by Expo start. Using CI=1 fallback.'
  );
}

const hasPort = userArgs.some((a) => a === '--port' || a.startsWith('--port='));
const isHeadlessSession = Boolean(
  process.env.CI || requestedNonInteractive || !process.stdout.isTTY || !process.stdin.isTTY
);
const defaultPort = process.env.EXPO_PORT || (isHeadlessSession ? '8082' : null);
if (!hasPort && defaultPort) {
  userArgs.push('--port', String(defaultPort));
}

const parsePortArg = (args) => {
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];

    if (current === '--port') {
      const candidate = Number(args[i + 1]);
      if (Number.isInteger(candidate) && candidate > 0 && candidate <= 65535) {
        return {
          kind: 'pair',
          index: i,
          port: candidate,
        };
      }
      return null;
    }

    if (current.startsWith('--port=')) {
      const candidate = Number(current.slice('--port='.length));
      if (Number.isInteger(candidate) && candidate > 0 && candidate <= 65535) {
        return {
          kind: 'inline',
          index: i,
          port: candidate,
        };
      }
      return null;
    }
  }

  return null;
};

const setPortArg = (args, portArg, nextPort) => {
  if (!portArg) return;

  if (portArg.kind === 'pair') {
    args[portArg.index + 1] = String(nextPort);
    return;
  }

  args[portArg.index] = `--port=${nextPort}`;
};

const canListenOnPort = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
  });

const ensurePortAvailableForHeadless = async (args, env) => {
  const shouldAutoResolvePort = Boolean(env.CI || !process.stdout.isTTY || !process.stdin.isTTY);
  if (!shouldAutoResolvePort) return;

  const portArg = parsePortArg(args);
  if (!portArg) return;

  let candidate = portArg.port;
  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    // Headless mode cannot answer Expo's port prompt, so we proactively scan.
    const available = await canListenOnPort(candidate);
    if (available) {
      if (candidate !== portArg.port) {
        console.warn(
          `[expo-start] Port ${portArg.port} is busy in headless mode. Using ${candidate} instead.`
        );
        setPortArg(args, portArg, candidate);
      }
      return;
    }
    candidate += 1;
  }

  console.warn(
    `[expo-start] Could not auto-select a free port near ${portArg.port}. Expo may request manual input.`
  );
};

const parseEnvFile = (filePath) => {
  const entries = {};
  if (!fs.existsSync(filePath)) return entries;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const splitIndex = trimmed.indexOf('=');
    if (splitIndex < 1) return;

    const key = trimmed.slice(0, splitIndex).trim();
    let value = trimmed.slice(splitIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  });

  return entries;
};

const collectLocalEnvVars = () => {
  const mode = process.env.NODE_ENV || 'development';
  const files = ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`];
  const merged = {};

  files.forEach((file) => {
    const filePath = path.resolve(process.cwd(), file);
    Object.assign(merged, parseEnvFile(filePath));
  });

  return merged;
};

const getPathSignature = (relativePath) => {
  const absolutePath = path.resolve(process.cwd(), relativePath);

  try {
    if (!fs.existsSync(absolutePath)) {
      return `${relativePath}:missing`;
    }

    const stats = fs.statSync(absolutePath);
    const size = stats.isFile() ? stats.size : 0;
    return `${relativePath}:${size}:${Math.floor(stats.mtimeMs)}`;
  } catch (error) {
    return `${relativePath}:error:${error.code || 'unknown'}`;
  }
};

const getMetroStartupSignature = () => {
  const parts = [
    ...metroSignatureFiles.map(getPathSignature),
    ...metroSignatureDirectories.map(getPathSignature),
  ];

  return parts.join('|');
};

const readMetroStartupState = () => {
  try {
    if (!fs.existsSync(metroStartupStateFile)) return null;

    const raw = fs.readFileSync(metroStartupStateFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeMetroStartupState = (signature) => {
  try {
    fs.mkdirSync(path.dirname(metroStartupStateFile), { recursive: true });
    fs.writeFileSync(
      metroStartupStateFile,
      JSON.stringify(
        {
          signature,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (error) {
    console.warn(`[expo-start] Could not persist Metro startup state: ${error.message}`);
  }
};

const listMetroTempCacheEntries = () => {
  const tempDir = os.tmpdir();

  try {
    return fs
      .readdirSync(tempDir, { withFileTypes: true })
      .filter((entry) => metroTempPrefixes.some((prefix) => entry.name.startsWith(prefix)))
      .map((entry) => {
        const absolutePath = path.join(tempDir, entry.name);
        const stats = fs.statSync(absolutePath);

        return {
          name: entry.name,
          absolutePath,
          isDirectory: stats.isDirectory(),
          mtimeMs: stats.mtimeMs,
        };
      });
  } catch {
    return [];
  }
};

const removeMetroTempCacheEntries = (entries) => {
  let removed = 0;

  entries.forEach((entry) => {
    try {
      if (entry.isDirectory) {
        fs.rmSync(entry.absolutePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(entry.absolutePath);
      }
      removed += 1;
    } catch {
      // Best effort cleanup. Metro will recreate anything it needs.
    }
  });

  return removed;
};

const removeProjectCacheDirectory = () => {
  const cacheDirectory = path.resolve(process.cwd(), 'node_modules', '.cache');

  try {
    if (!fs.existsSync(cacheDirectory)) return false;
    fs.rmSync(cacheDirectory, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
};

const guardMetroCacheOnWindows = () => {
  const signature = getMetroStartupSignature();

  if (process.platform !== 'win32') {
    writeMetroStartupState(signature);
    return;
  }

  const previousState = readMetroStartupState();
  const tempEntries = listMetroTempCacheEntries();
  const now = Date.now();
  const projectGraphChanged = Boolean(
    previousState?.signature && previousState.signature !== signature
  );
  const staleCacheDetected = tempEntries.some(
    (entry) => now - entry.mtimeMs > 6 * 60 * 60 * 1000
  );
  const cacheCountIsHigh = tempEntries.length >= 15;

  let reason = null;
  if (projectGraphChanged && tempEntries.length > 0) {
    reason = 'Project files changed since the last Metro start';
  } else if (cacheCountIsHigh) {
    reason = 'Metro temp cache has accumulated too many entries';
  } else if (staleCacheDetected) {
    reason = 'Metro temp cache is stale';
  }

  if (reason) {
    const removedTempEntries = removeMetroTempCacheEntries(tempEntries);
    const removedProjectCache = removeProjectCacheDirectory();
    const projectCacheSuffix = removedProjectCache ? ' and node_modules/.cache' : '';

    console.log(`[expo-start] ${reason}. Clearing stale Metro caches on Windows.`);
    console.log(
      `[expo-start] Removed ${removedTempEntries} Metro cache entr${
        removedTempEntries === 1 ? 'y' : 'ies'
      }${projectCacheSuffix}.`
    );
  }

  writeMetroStartupState(signature);
};

const warnIfFirebaseEnvMissing = (runtimeEnv) => {
  const localEnvVars = collectLocalEnvVars();
  const missing = requiredFirebaseKeys.filter((key) => {
    const value = (runtimeEnv[key] || localEnvVars[key] || '').trim();
    return value.length === 0;
  });

  if (missing.length === 0) return;

  console.warn(
    '[expo-start] Firebase config incomplete. Firebase-backed features will run in fallback mode.'
  );
  console.warn(`[expo-start] Missing vars: ${missing.join(', ')}`);
  console.warn(
    '[expo-start] Add keys to .env.local or run: npm run check:firebase-env'
  );
};

const getLocalIP = () => {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (
            iface.address.startsWith('192.168.') ||
            iface.address.startsWith('10.') ||
            iface.address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
          ) {
            return iface.address;
          }
        }
      }
    }

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (error) {
    console.warn('IP address detection failed:', error.message);
  }
  return null;
};

let performedExplicitClear = false;

if (userArgs.includes('--clear')) {
  console.log('Clearing cache...\n');
  const cleanCacheScript = path.join(__dirname, 'clean-cache.js');
  try {
    require(cleanCacheScript);
    performedExplicitClear = true;
  } catch (error) {
    console.warn('Cache clean script failed:', error.message);
  }
  userArgs.splice(userArgs.indexOf('--clear'), 1);
}

if (!userArgs.includes('--tunnel') && !userArgs.includes('--localhost') && !userArgs.includes('--lan')) {
  const localIP = getLocalIP();
  if (localIP) {
    userArgs.push('--lan');
    console.log(`Network detected: ${localIP}`);
    console.log('If IP issues occur: npm run start:tunnel\n');
  } else {
    console.warn('IP address could not be detected, tunnel mode is recommended: npm run start:tunnel');
  }
}

const useDevClient = userArgs.includes('--dev-client');
if (useDevClient) {
  userArgs.splice(userArgs.indexOf('--dev-client'), 1);
  console.log('Starting in development build mode...\n');
} else if (
  !userArgs.includes('--go') &&
  !userArgs.includes('--web') &&
  !userArgs.includes('--android') &&
  !userArgs.includes('--ios')
) {
  userArgs.push('--go');
  console.log('Starting in Expo Go mode...');
  console.log('For development build: npm run start:dev\n');
}

const env = {
  ...process.env,
};

if (requestedNonInteractive && !env.CI) {
  env.CI = '1';
}

if (!env.EXPO_NO_DEPENDENCY_VALIDATION) {
  env.EXPO_NO_DEPENDENCY_VALIDATION = '1';
}

if (!performedExplicitClear) {
  guardMetroCacheOnWindows();
} else {
  writeMetroStartupState(getMetroStartupSignature());
}

warnIfFirebaseEnvMissing(env);

if (env.NODE_EXTRA_CA_CERTS) {
  const normalized = env.NODE_EXTRA_CA_CERTS.replace(/^"+|"+$/g, '').trim();

  if (normalized.toLowerCase().includes('\\path\\') || normalized.toLowerCase().includes('/path/')) {
    console.warn(
      `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: placeholder path detected (${normalized})`
    );
    delete env.NODE_EXTRA_CA_CERTS;
  } else if (!fs.existsSync(normalized)) {
    console.warn(
      `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: file not found (${normalized})`
    );
    delete env.NODE_EXTRA_CA_CERTS;
  } else {
    try {
      const stats = fs.statSync(normalized);
      if (!stats.isFile()) {
        console.warn(
          `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: path is not a file (${normalized})`
        );
        delete env.NODE_EXTRA_CA_CERTS;
      } else {
        try {
          const content = fs.readFileSync(normalized, 'utf8');
          if (!content.includes('-----BEGIN') && !content.includes('BEGIN CERTIFICATE')) {
            console.warn(
              `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: file does not appear to be a valid certificate (${normalized})`
            );
            delete env.NODE_EXTRA_CA_CERTS;
          } else {
            env.NODE_EXTRA_CA_CERTS = normalized;
          }
        } catch (readError) {
          console.warn(
            `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: cannot read file (${normalized}): ${readError.message}`
          );
          delete env.NODE_EXTRA_CA_CERTS;
        }
      }
    } catch (statError) {
      console.warn(
        `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: cannot access file (${normalized}): ${statError.message}`
      );
      delete env.NODE_EXTRA_CA_CERTS;
    }
  }
}

const proxyKeys = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'no_proxy',
];

const shouldStripProxy =
  env.EXPO_STRIP_PROXY === '1' || env.EXPO_STRIP_PROXY === 'true';

if (shouldStripProxy) {
  proxyKeys.forEach((key) => {
    delete env[key];
  });
}

const runExpo = async () => {
  await ensurePortAvailableForHeadless(userArgs, env);
  const args = ['start', ...userArgs];

  const child = spawn(process.execPath, [expoCli, ...args], {
    stdio: 'inherit',
    env,
  });

  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
};

runExpo().catch((error) => {
  console.error(error);
  process.exit(1);
});
