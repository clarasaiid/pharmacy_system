const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add proper MIME type handling
  config.module.rules.push({
    test: /\.(js|mjs|jsx|ts|tsx)$/,
    type: 'javascript/auto',
    resolve: {
      fullySpecified: false
    }
  });

  // Ensure proper MIME type for JavaScript files
  config.output = {
    ...config.output,
    publicPath: '/',
  };

  return config;
}; 