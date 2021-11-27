'use strict';

const React = require('react');
const WaterfallRenderContext = require('react-waterfall-render/public/WaterfallRenderContext.js');
const LoadingCacheValue = require('./LoadingCacheValue.js');
const createArgErrorMessageProd = require('./createArgErrorMessageProd.js');
const useCache = require('./useCache.js');

/**
 * A React hook to load a [cache]{@link Cache#store} entry if the
 * [waterfall render context](https://github.com/jaydenseric/react-waterfall-render#member-waterfallrendercontext)
 * is populated, i.e. when
 * [waterfall rendering](https://github.com/jaydenseric/react-waterfall-render#function-waterfallrender)
 * for either a server side render or to preload components in a browser
 * environment.
 * @kind function
 * @name useWaterfallLoad
 * @param {CacheKey} cacheKey Cache key.
 * @param {Loader} load Memoized function that starts the loading.
 * @returns {boolean} Did loading start. If so, it’s efficient for the component to return `null` since this render will be discarded anyway for a re-render onces the loading ends.
 * @see [`useAutoLoad`]{@link useAutoLoad}, often used alongside this hook.
 * @example <caption>How to `import`.</caption>
 * ```js
 * import useWaterfallLoad from 'graphql-react/useWaterfallLoad.js';
 * ```
 * @example <caption>How to `require`.</caption>
 * ```js
 * const useWaterfallLoad = require('graphql-react/useWaterfallLoad.js');
 * ```
 */
module.exports = function useWaterfallLoad(cacheKey, load) {
  if (typeof cacheKey !== 'string')
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 1 `cacheKey` must be a string.'
        : createArgErrorMessageProd(1)
    );

  if (typeof load !== 'function')
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 2 `load` must be a function.'
        : createArgErrorMessageProd(2)
    );

  const cache = useCache();
  const declareLoading = React.useContext(WaterfallRenderContext);

  if (declareLoading && !(cacheKey in cache.store)) {
    // Todo: First, check if already loading?
    const loadingCacheValue = load();

    if (!(loadingCacheValue instanceof LoadingCacheValue))
      throw new TypeError(
        'Argument 2 `load` must return a `LoadingCacheValue` instance.'
      );

    declareLoading(loadingCacheValue.promise);

    return true;
  }

  return false;
};
