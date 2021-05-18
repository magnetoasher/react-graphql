'use strict';

const { deepStrictEqual, strictEqual, throws } = require('assert');
const revertableGlobals = require('revertable-globals');
const createArgErrorMessageProd = require('../../private/createArgErrorMessageProd');
const Cache = require('../../public/Cache');
const cacheDelete = require('../../public/cacheDelete');

module.exports = (tests) => {
  tests.add('`cacheDelete` argument 1 `cache` not a `Cache` instance.', () => {
    const cache = true;

    throws(() => {
      cacheDelete(cache);
    }, new TypeError('Argument 1 `cache` must be a `Cache` instance.'));

    const revertGlobals = revertableGlobals(
      { NODE_ENV: 'production' },
      process.env
    );

    try {
      throws(() => {
        cacheDelete(cache);
      }, new TypeError(createArgErrorMessageProd(1)));
    } finally {
      revertGlobals();
    }
  });

  tests.add(
    '`cacheDelete` argument 2 `cacheKeyMatcher` not a function.',
    () => {
      const cache = new Cache();
      const cacheKeyMatcher = true;

      throws(() => {
        cacheDelete(cache, cacheKeyMatcher);
      }, new TypeError('Argument 2 `cacheKeyMatcher` must be a function.'));

      const revertGlobals = revertableGlobals(
        { NODE_ENV: 'production' },
        process.env
      );

      try {
        throws(() => {
          cacheDelete(cache, cacheKeyMatcher);
        }, new TypeError(createArgErrorMessageProd(2)));
      } finally {
        revertGlobals();
      }
    }
  );

  tests.add('`cacheDelete` argument 2 `cacheKeyMatcher` unused.', () => {
    const cache = new Cache({ a: 1, b: 2 });
    const events = [];
    const listener = (event) => {
      events.push(event);
    };

    cache.addEventListener('a/delete', listener);
    cache.addEventListener('b/delete', listener);

    cacheDelete(cache);

    strictEqual(events.length, 2);

    strictEqual(events[0] instanceof CustomEvent, true);
    strictEqual(events[0].type, 'a/delete');
    strictEqual(events[0].cancelable, false);

    strictEqual(events[1] instanceof CustomEvent, true);
    strictEqual(events[1].type, 'b/delete');
    strictEqual(events[1].cancelable, false);

    deepStrictEqual(cache.store, {});
  });

  tests.add('`cacheDelete` argument 2 `cacheKeyMatcher` used.', () => {
    const cache = new Cache({ a: 1, b: 2, c: 3 });
    const events = [];
    const listener = (event) => {
      events.push(event);
    };

    cache.addEventListener('a/delete', listener);
    cache.addEventListener('b/delete', listener);
    cache.addEventListener('c/delete', listener);

    cacheDelete(cache, (cacheKey) => cacheKey !== 'b');

    strictEqual(events.length, 2);

    strictEqual(events[0] instanceof CustomEvent, true);
    strictEqual(events[0].type, 'a/delete');
    strictEqual(events[0].cancelable, false);

    strictEqual(events[1] instanceof CustomEvent, true);
    strictEqual(events[1].type, 'c/delete');
    strictEqual(events[1].cancelable, false);

    deepStrictEqual(cache.store, { b: 2 });
  });
};