const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const expoRoot = path.dirname(require.resolve('expo/package.json'));
const expoCli = path.join(expoRoot, 'bin', 'cli');
const args = ['start', ...process.argv.slice(2)];

const env = {
  ...process.env,
};

if (!env.EXPO_NO_DEPENDENCY_VALIDATION) {
  env.EXPO_NO_DEPENDENCY_VALIDATION = '1';
}

if (env.NODE_EXTRA_CA_CERTS) {
  const normalized = env.NODE_EXTRA_CA_CERTS.replace(/^"+|"+$/g, '');
  if (!fs.existsSync(normalized)) {
    console.warn(
      `[expo-start] Ignoring NODE_EXTRA_CA_CERTS: file not found (${normalized})`
    );
    delete env.NODE_EXTRA_CA_CERTS;
  } else {
    env.NODE_EXTRA_CA_CERTS = normalized;
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
