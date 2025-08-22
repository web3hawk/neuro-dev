// Disable babel-loader cache via CRACO override for CRA 5
/**
 * CRA 5 places babel-loader inside module.rules[...].oneOf array items
 * for JS/JSX and TS/TSX. We will iterate over the rules and set
 * options.cacheDirectory = false to disable caching.
 *
 * Use Webpack 5 in-memory cache (avoid filesystem "default-*")
 * and disable ESLint cache (".eslintcache").
 */

/** @type {import('@craco/craco').CracoConfig} */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1) Use filesystem cache in node_modules directory instead of memory cache
      webpackConfig.cache = { 
        type: 'filesystem',
        cacheDirectory: require('path').resolve(__dirname, '../../node_modules/.cache/webpack')
      };
      
      // 2) Fix source map parsing issues with antd and other libraries
      webpackConfig.devtool = process.env.NODE_ENV === 'production' ? false : 'eval-source-map';
      
      const rules = webpackConfig?.module?.rules || [];

      const visitRule = (rule) => {
        if (!rule) return;
        if (Array.isArray(rule.use)) {
          rule.use.forEach(visitLoader);
        }
        if (rule.loader) {
          visitLoader(rule);
        }
        if (Array.isArray(rule.oneOf)) {
          rule.oneOf.forEach(visitRule);
        }
        if (Array.isArray(rule.rules)) {
          rule.rules.forEach(visitRule);
        }
      };

      const visitLoader = (loaderObj) => {
        const loaderPath = loaderObj.loader || (typeof loaderObj === 'string' ? loaderObj : '');
        if (loaderPath && loaderPath.includes('babel-loader')) {
          loaderObj.options = loaderObj.options || {};
          loaderObj.options.cacheDirectory = false;
        }
      };

      // 2) Disable ESLint cache written by ESLintWebpackPlugin (prevents .eslintcache)
      if (Array.isArray(webpackConfig.plugins)) {
        webpackConfig.plugins.forEach((plugin) => {
          const ctorName = plugin && plugin.constructor && plugin.constructor.name;
          if (ctorName === 'ESLintWebpackPlugin' || ctorName === 'ESLintPlugin') {
            if (plugin.options) {
              plugin.options.cache = false;
            }
          }
          // 3) Ensure ForkTsChecker uses incremental with specified tsBuildInfoFile path
          if (ctorName === 'ForkTsCheckerWebpackPlugin') {
            plugin.options = plugin.options || {};
            plugin.options.typescript = plugin.options.typescript || {};
            // Ensure configOverwrite exists to inject compilerOptions overrides
            plugin.options.typescript.configOverwrite = plugin.options.typescript.configOverwrite || {};
            plugin.options.typescript.configOverwrite.compilerOptions = {
              ...(plugin.options.typescript.configOverwrite.compilerOptions || {}),
              incremental: true,
              tsBuildInfoFile: require('path').resolve(__dirname, '../../node_modules/tsbuildinfo/build.tsbuildinfo'),
            };
          }
        });
      }

      rules.forEach(visitRule);
      return webpackConfig;
    },
  },
};
