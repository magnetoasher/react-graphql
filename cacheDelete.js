'use strict';

const Cache = require('./Cache.js');
const cacheEntryDelete = require('./cacheEntryDelete.js');
const createArgErrorMessageProd = require('./createArgErrorMessageProd.js');

/**
 * Deletes [cache]{@link Cache#store} entries. Useful after a user logs out.
 * @kind function
 * @name cacheDelete
 * @param {Cache} cache Cache to update.
 * @param {CacheKeyMatcher} [cacheKeyMatcher] Matches [cache keys]{@link CacheKey} to delete. By default all are matched.
 * @fires Cache#event:delete
 * @example <caption>How to `import`.</caption>
 * ```js
 * import cacheDelete from 'graphql-react/cacheDelete.js';
 * ```
 * @example <caption>How to `require`.</caption>
 * ```js
 * const cacheDelete = require('graphql-react/cacheDelete.js');
 * ```
 */
module.exports = function cacheDelete(cache, cacheKeyMatcher) {
  if (!(cache instanceof Cache))
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 1 `cache` must be a `Cache` instance.'
        : createArgErrorMessageProd(1)
    );

  if (cacheKeyMatcher !== undefined && typeof cacheKeyMatcher !== 'function')
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 2 `cacheKeyMatcher` must be a function.'
        : createArgErrorMessageProd(2)
    );

  for (const cacheKey in cache.store)
    if (!cacheKeyMatcher || cacheKeyMatcher(cacheKey))
      cacheEntryDelete(cache, cacheKey);
};
