'use strict';

const { useContext, useEffect, useRef } = require('react');
const createArgErrorMessageProd = require('../private/createArgErrorMessageProd');
const HYDRATION_TIME_MS = require('./HYDRATION_TIME_MS');
const HydrationTimeStampContext = require('./HydrationTimeStampContext');
const useCache = require('./useCache');

/**
 * A React hook to automatically load a [cache]{@link Cache#store} entry after
 * the component mounts or the [cache context]{@link CacheContext} or any of the
 * arguments change, except during the
 * [hydration time]{@link HYDRATION_TIME_MS} if the
 * [hydration time stamp context]{@link HydrationTimeStampContext} is populated
 * and the [cache]{@link Cache#store} entry is already populated.
 * @kind function
 * @name useLoadOnMount
 * @param {CacheKey} cacheKey Cache key.
 * @param {Loader} load Memoized function that starts the loading.
 * @example <caption>Ways to `import`.</caption>
 * ```js
 * import { useLoadOnMount } from 'graphql-react';
 * ```
 *
 * ```js
 * import useLoadOnMount from 'graphql-react/public/useLoadOnMount.js';
 * ```
 * @example <caption>Ways to `require`.</caption>
 * ```js
 * const { useLoadOnMount } = require('graphql-react');
 * ```
 *
 * ```js
 * const useLoadOnMount = require('graphql-react/public/useLoadOnMount');
 * ```
 */
module.exports = function useLoadOnMount(cacheKey, load) {
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
  const hydrationTimeStamp = useContext(HydrationTimeStampContext);

  if (
    // Allowed to be undefined for apps that don’t provide this context.
    hydrationTimeStamp !== undefined &&
    typeof hydrationTimeStamp !== 'number'
  )
    throw new TypeError('Hydration time stamp context value must be a number.');

  const startedRef = useRef();

  useEffect(() => {
    if (
      // Loading the same as currently specified wasn’t already started.
      !(
        startedRef.current &&
        startedRef.current.cache === cache &&
        startedRef.current.cacheKey === cacheKey &&
        startedRef.current.load === load
      ) &&
      // Waterfall loaded cache isn’t being hydrated.
      !(
        cacheKey in cache.store &&
        // Within the hydration time. If `hydrationTimeStamp` is undefined the
        // comparison safely evaluates to false.
        performance.now() - hydrationTimeStamp < HYDRATION_TIME_MS
      )
    ) {
      startedRef.current = {
        cache,
        cacheKey,
        load,
      };

      load();
    }
  }, [cache, cacheKey, hydrationTimeStamp, load]);
};
