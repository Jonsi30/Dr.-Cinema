const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname, {
  resolver: {
    nodeModulesPaths: ['./node_modules'],
  },
});