import isObject from 'isobject/index.cjs.js';
import React from 'react';
import LoadingCacheValue from './LoadingCacheValue.mjs';
import createArgErrorMessageProd from './createArgErrorMessageProd.mjs';
import fetchGraphQL from './fetchGraphQL.mjs';
import useCache from './useCache.mjs';
import useLoading from './useLoading.mjs';

/**
 * A React hook to get a function for loading a GraphQL operation.
 * @kind function
 * @name useLoadGraphQL
 * @returns {LoadGraphQL} Loads a GraphQL operation.
 * @example <caption>How to `import`.</caption>
 * ```js
 * import useLoadGraphQL from 'graphql-react/useLoadGraphQL.mjs';
 * ```
 */
export default function useLoadGraphQL() {
  const cache = useCache();
  const loading = useLoading();

  return React.useCallback(
    (cacheKey, fetchUri, fetchOptions) => {
      if (typeof cacheKey !== 'string')
        throw new TypeError(
          typeof process === 'object' && process.env.NODE_ENV !== 'production'
            ? 'Argument 1 `cacheKey` must be a string.'
            : createArgErrorMessageProd(1)
        );

      if (typeof fetchUri !== 'string')
        throw new TypeError(
          typeof process === 'object' && process.env.NODE_ENV !== 'production'
            ? 'Argument 2 `fetchUri` must be a string.'
            : createArgErrorMessageProd(2)
        );

      if (!isObject(fetchOptions))
        throw new TypeError(
          typeof process === 'object' && process.env.NODE_ENV !== 'production'
            ? 'Argument 3 `fetchOptions` must be an object.'
            : createArgErrorMessageProd(3)
        );

      // Avoid mutating the input fetch options.
      const { signal, ...modifiedFetchOptions } = fetchOptions;
      const abortController = new AbortController();

      // Respect an existing abort controller signal.
      if (signal)
        signal.aborted
          ? // Signal already aborted, so immediately abort.
            abortController.abort()
          : // Signal not already aborted, so setup a listener to abort when it
            // does.
            signal.addEventListener(
              'abort',
              () => {
                abortController.abort();
              },
              {
                // Prevent a memory leak if the existing abort controller is
                // long lasting, or controls multiple things.
                once: true,
              }
            );

      modifiedFetchOptions.signal = abortController.signal;

      return new LoadingCacheValue(
        loading,
        cache,
        cacheKey,
        fetchGraphQL(fetchUri, modifiedFetchOptions),
        abortController
      );
    },
    [cache, loading]
  );
}
