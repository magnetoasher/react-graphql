import Cache from './Cache.mjs';
import createArgErrorMessageProd from './createArgErrorMessageProd.mjs';

/**
 * Deletes a [cache]{@link Cache#store} entry.
 * @kind function
 * @name cacheEntryDelete
 * @param {Cache} cache Cache to update.
 * @param {CacheKey} cacheKey Cache key.
 * @fires Cache#event:delete
 * @example <caption>How to `import`.</caption>
 * ```js
 * import cacheEntryDelete from 'graphql-react/cacheEntryDelete.mjs';
 * ```
 */
export default function cacheEntryDelete(cache, cacheKey) {
  if (!(cache instanceof Cache))
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 1 `cache` must be a `Cache` instance.'
        : createArgErrorMessageProd(1)
    );

  if (typeof cacheKey !== 'string')
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 2 `cacheKey` must be a string.'
        : createArgErrorMessageProd(2)
    );

  if (cacheKey in cache.store) {
    delete cache.store[cacheKey];

    cache.dispatchEvent(new CustomEvent(`${cacheKey}/delete`));
  }
}
