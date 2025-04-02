const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

// Get the default Expo config
const defaultConfig = getDefaultConfig(__dirname);

// Add optimizations
const config = {
  ...defaultConfig,
  // Optimize transformer
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
  // Optimize resolver
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    // Cache resolution results
    useWatchman: true,
    // Optimize module resolution
    extraNodeModules: {
      // Add any module aliases here if needed
    },
  },
  // Enable caching
  cacheStores: [
    // Use in-memory cache for faster rebuilds
    require('metro-cache').FileStore,
  ],
  // Optimize serialization
  serializer: {
    ...defaultConfig.serializer,
    // Enable code splitting for better performance
    createModuleIdFactory: () => {
      const fileToIdMap = new Map();
      let nextId = 0;
      return (path) => {
        if (!fileToIdMap.has(path)) {
          fileToIdMap.set(path, nextId);
          nextId += 1;
        }
        return fileToIdMap.get(path);
      };
    },
  },
};

// Apply Reanimated config wrapper
module.exports = wrapWithReanimatedMetroConfig(config);
