const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Hermes for all platforms to fix bundling issues
config.transformer = {
  ...config.transformer,
  hermesParser: false,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Override transform options to disable Hermes
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;