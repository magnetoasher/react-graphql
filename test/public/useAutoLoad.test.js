'use strict';

const { strictEqual, throws } = require('assert');
const { cleanup, renderHook } = require('@testing-library/react-hooks/pure');
const { jsx } = require('react/jsx-runtime');
const revertableGlobals = require('revertable-globals');
const createArgErrorMessageProd = require('../../private/createArgErrorMessageProd');
const Cache = require('../../public/Cache');
const CacheContext = require('../../public/CacheContext');
const Loading = require('../../public/Loading');
const LoadingCacheValue = require('../../public/LoadingCacheValue');
const cacheEntryDelete = require('../../public/cacheEntryDelete');
const cacheEntryPrune = require('../../public/cacheEntryPrune');
const cacheEntryStale = require('../../public/cacheEntryStale');
const useAutoLoad = require('../../public/useAutoLoad');

module.exports = (tests) => {
  tests.add('`useAutoLoad` argument 1 `cacheKey` not a string.', () => {
    const cacheKey = true;

    throws(() => {
      useAutoLoad(cacheKey);
    }, new TypeError('Argument 1 `cacheKey` must be a string.'));

    const revertGlobals = revertableGlobals(
      { NODE_ENV: 'production' },
      process.env
    );

    try {
      throws(() => {
        useAutoLoad(cacheKey);
      }, new TypeError(createArgErrorMessageProd(1)));
    } finally {
      revertGlobals();
    }
  });

  tests.add('`useAutoLoad` argument 2 `load` not a function.', () => {
    const cacheKey = 'a';
    const load = true;

    throws(() => {
      useAutoLoad(cacheKey, load);
    }, new TypeError('Argument 2 `load` must be a function.'));

    const revertGlobals = revertableGlobals(
      { NODE_ENV: 'production' },
      process.env
    );

    try {
      throws(() => {
        useAutoLoad(cacheKey, load);
      }, new TypeError(createArgErrorMessageProd(2)));
    } finally {
      revertGlobals();
    }
  });

  tests.add('`useAutoLoad` functionality.', async () => {
    const cacheKey = 'a';
    const cache = new Cache({
      // Populate the cache entry so it can be deleted.
      [cacheKey]: 0,
    });
    const loading = new Loading();
    const loadCalls = [];

    // eslint-disable-next-line jsdoc/require-jsdoc
    function load() {
      const loadingCacheValue = new LoadingCacheValue(
        loading,
        cache,
        cacheKey,
        Promise.resolve(1),
        new AbortController()
      );

      loadCalls.push({
        hadArgs: !!arguments.length,
        loadingCacheValue,
      });

      return loadingCacheValue;
    }

    const wrapper = ({ children }) =>
      jsx(CacheContext.Provider, {
        value: cache,
        children,
      });

    try {
      // Test load on mount.

      const { result, rerender, unmount } = renderHook(
        () => useAutoLoad(cacheKey, load),
        { wrapper }
      );

      strictEqual(result.all.length, 1);
      strictEqual(typeof result.current, 'function');
      strictEqual(result.error, undefined);
      strictEqual(loadCalls.length, 1);
      strictEqual(loadCalls[0].hadArgs, false);
      strictEqual(
        loadCalls[0].loadingCacheValue.abortController.signal.aborted,
        false
      );

      // Test that the returned auto abort load function is memoized, and that
      // re-rendering doesn’t result in another load.

      rerender();

      strictEqual(result.all.length, 2);
      strictEqual(result.current, result.all[0]);
      strictEqual(result.error, undefined);
      strictEqual(loadCalls.length, 1);

      // Test prune prevention.

      cacheEntryPrune(cache, cacheKey);

      strictEqual(cacheKey in cache.store, true);

      // Test load on stale.

      cacheEntryStale(cache, cacheKey);

      strictEqual(loadCalls.length, 2);
      strictEqual(
        loadCalls[0].loadingCacheValue.abortController.signal.aborted,
        true
      );
      strictEqual(loadCalls[1].hadArgs, false);
      strictEqual(
        loadCalls[1].loadingCacheValue.abortController.signal.aborted,
        false
      );

      // Test load on delete.

      cacheEntryDelete(cache, cacheKey);

      strictEqual(loadCalls.length, 3);
      strictEqual(
        loadCalls[1].loadingCacheValue.abortController.signal.aborted,
        true
      );
      strictEqual(loadCalls[2].hadArgs, false);
      strictEqual(
        loadCalls[2].loadingCacheValue.abortController.signal.aborted,
        false
      );

      // Nothing should have caused a re-render.
      strictEqual(result.all.length, 2);

      // Test that the last loading is aborted on unmount.
      unmount();

      strictEqual(
        loadCalls[2].loadingCacheValue.abortController.signal.aborted,
        true
      );
    } finally {
      cleanup();
    }
  });
};