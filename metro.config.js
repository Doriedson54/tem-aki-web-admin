const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Desabilitar Hermes completamente
config.transformer = {
  ...config.transformer,
  hermesCommand: '',
  enableHermes: false,
  hermesParser: false,
  jsEngine: 'jsc',
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Override transform options to disable Hermes
config.transformer.getTransformOptions = async (entryPoints, options, getDependenciesOf) => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
  // Forçar JSC para todas as plataformas, especialmente web
  engine: 'jsc',
  hermesParser: false,
});

// Configurar resolver
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  // Desabilitar Hermes explicitamente
  enableHermes: false
};

// Configurações específicas removidas (causavam warning)

module.exports = config;