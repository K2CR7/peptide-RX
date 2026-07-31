const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Works around a Metro + react-native-svg web-resolution bug: Metro's
// package-exports algorithm fails to resolve some of react-native-svg's
// relative subpath imports (e.g. "./deprecated") on web. Falling back to
// classic resolution fixes it without needing a patch on the library.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
