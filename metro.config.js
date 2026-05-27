// Learn more: https://docs.expo.dev/guides/customizing-metro/
//
// `getSentryExpoConfig` is a thin wrapper around `expo/metro-config`'s
// `getDefaultConfig` that also wires the Sentry serializer so production
// builds upload Hermes source maps automatically. Drop-in replacement —
// passes the Expo doctor "extends expo/metro-config" check.
//
// If you remove Sentry, switch this back to:
//   const { getDefaultConfig } = require('expo/metro-config');
//   const config = getDefaultConfig(__dirname);
//   module.exports = config;

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

module.exports = config;
