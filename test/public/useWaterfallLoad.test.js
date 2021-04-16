'use strict';

const { deepStrictEqual, rejects, strictEqual, throws } = require('assert');
const {
  cleanup,
  renderHook,
  suppressErrorOutput,
} = require('@testing-library/react-hooks/pure');
const { renderToStaticMarkup } = require('react-dom/server');
const waterfallRender = require('react-waterfall-render/public/waterfallRender');
const { jsx } = require('react/jsx-runtime');
const revertableGlobals = require('revertable-globals');
const createArgErrorMessageProd = require('../../private/createArgErrorMessageProd');
const Cache = require('../../public/Cache');
const CacheContext = require('../../public/CacheContext');
const Loading = require('../../public/Loading');
const LoadingCacheValue = require('../../public/LoadingCacheValue');
const useCacheEntry = require('../../public/useCacheEntry');
const useWaterfallLoad = require('../../public/useWaterfallLoad');

module.exports = (tests) => {
  tests.add('`useWaterfallLoad` argument 1 `cacheKey` not a string.', () => {
    const cacheKey = true;

    throws(() => {
      useWaterfallLoad(cacheKey);
    }, new TypeError('Argument 1 `cacheKey` must be a string.'));

    const revertGlobals = revertableGlobals(
      { NODE_ENV: 'production' },
      process.env
    );

    try {
      throws(() => {
        useWaterfallLoad(cacheKey);
      }, new TypeError(createArgErrorMessageProd(1)));
    } finally {
      revertGlobals();
    }
  });

  tests.add('`useWaterfallLoad` argument 2 `load` not a function.', () => {
    const cacheKey = 'a';
    const load = true;

    throws(() => {
      useWaterfallLoad(cacheKey, load);
    }, new TypeError('Argument 2 `load` must be a function.'));

    const revertGlobals = revertableGlobals(
      { NODE_ENV: 'production' },
      process.env
    );

    try {
      throws(() => {
        useWaterfallLoad(cacheKey, load);
      }, new TypeError(createArgErrorMessageProd(2)));
    } finally {
      revertGlobals();
    }
  });

  tests.add('`useWaterfallLoad` with cache context missing.', () => {
    try {
      const revertConsole = suppressErrorOutput();

      try {
        var { result } = renderHook(() => useWaterfallLoad('a', () => {}));
      } finally {
        revertConsole();
      }

      deepStrictEqual(result.error, new TypeError('Cache context missing.'));
    } finally {
      cleanup();
    }
  });

  tests.add(
    '`useWaterfallLoad` with cache context value not a `Cache` instance.',
    () => {
      try {
        const wrapper = ({ children }) =>
          jsx(CacheContext.Provider, {
            value: true,
            children,
          });

        const revertConsole = suppressErrorOutput();

        try {
          var { result } = renderHook(() => useWaterfallLoad('a', () => {}), {
            wrapper,
          });
        } finally {
          revertConsole();
        }

        deepStrictEqual(
          result.error,
          new TypeError('Cache context value must be a `Cache` instance.')
        );
      } finally {
        cleanup();
      }
    }
  );

  tests.add(
    '`useWaterfallLoad` with waterfall render context value undefined.',
    () => {
      try {
        const cache = new Cache();
        const wrapper = ({ children }) =>
          jsx(CacheContext.Provider, {
            value: cache,
            children,
          });

        let didLoad = false;

        const { result } = renderHook(
          () =>
            useWaterfallLoad('a', () => {
              didLoad = true;
            }),
          { wrapper }
        );

        strictEqual(didLoad, false);
        strictEqual(result.all.length, 1);
        strictEqual(result.current, false);
        strictEqual(result.error, undefined);
      } finally {
        cleanup();
      }
    }
  );

  tests.add(
    '`useWaterfallLoad` with waterfall render context value defined, without initial cache value, invalid `load` return.',
    async () => {
      const cache = new Cache();

      const TestComponent = () => {
        useWaterfallLoad('a', () => true);

        return null;
      };

      await rejects(
        waterfallRender(
          jsx(CacheContext.Provider, {
            value: cache,
            children: jsx(TestComponent, {}),
          }),
          renderToStaticMarkup
        ),
        new TypeError(
          'Argument 2 `load` must return a `LoadingCacheValue` instance.'
        )
      );
    }
  );

  tests.add(
    '`useWaterfallLoad` with waterfall render context value defined, without initial cache value, valid `load` return.',
    async () => {
      const cacheKey = 'a';
      const cacheValue = 'b';
      const cache = new Cache();
      const loading = new Loading();
      const loadCalls = [];
      const hookReturns = [];

      // eslint-disable-next-line jsdoc/require-jsdoc
      function load() {
        loadCalls.push(!!arguments.length);

        return new LoadingCacheValue(
          loading,
          cache,
          cacheKey,
          Promise.resolve(cacheValue),
          new AbortController()
        );
      }

      const TestComponent = () => {
        const didLoad = useWaterfallLoad(cacheKey, load);
        hookReturns.push(didLoad);

        const cacheValue = useCacheEntry(cacheKey);

        return didLoad ? null : cacheValue;
      };

      const html = await waterfallRender(
        jsx(CacheContext.Provider, {
          value: cache,
          children: jsx(TestComponent, {}),
        }),
        renderToStaticMarkup
      );

      deepStrictEqual(loadCalls, [false]);
      deepStrictEqual(hookReturns, [true, false]);
      deepStrictEqual(cache.store, {
        [cacheKey]: cacheValue,
      });
      strictEqual(html, cacheValue);
    }
  );

  tests.add(
    '`useWaterfallLoad` with waterfall render context value defined, with initial cache value, valid `load` return.',
    async () => {
      const cacheKey = 'a';
      const cacheValue = 'b';
      const cache = new Cache({
        [cacheKey]: cacheValue,
      });
      const loading = new Loading();
      const loadCalls = [];
      const hookReturns = [];

      // eslint-disable-next-line jsdoc/require-jsdoc
      function load() {
        loadCalls.push(!!arguments.length);

        return new LoadingCacheValue(
          loading,
          cache,
          cacheKey,
          Promise.resolve('c'),
          new AbortController()
        );
      }

      const TestComponent = () => {
        const didLoad = useWaterfallLoad(cacheKey, load);
        hookReturns.push(didLoad);

        const cacheValue = useCacheEntry(cacheKey);

        return didLoad ? null : cacheValue;
      };

      const html = await waterfallRender(
        jsx(CacheContext.Provider, {
          value: cache,
          children: jsx(TestComponent, {}),
        }),
        renderToStaticMarkup
      );

      deepStrictEqual(loadCalls, []);
      deepStrictEqual(hookReturns, [false]);
      strictEqual(html, cacheValue);
    }
  );
};
