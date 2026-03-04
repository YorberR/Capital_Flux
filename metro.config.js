const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions so Metro can resolve expo-sqlite's web worker
// Without this, web bundling fails because Metro can't resolve .wasm imports
config.resolver.assetExts.push('wasm');

module.exports = config;
