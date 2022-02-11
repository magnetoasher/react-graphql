// @ts-check

import { deepStrictEqual, strictEqual, throws } from "assert";

import Cache from "./Cache.mjs";
import cacheDelete from "./cacheDelete.mjs";
import assertBundleSize from "./test/assertBundleSize.mjs";
import assertInstanceOf from "./test/assertInstanceOf.mjs";

/**
 * Adds `cacheDelete` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add("`cacheDelete` bundle size.", async () => {
    await assertBundleSize(new URL("./cacheDelete.mjs", import.meta.url), 400);
  });

  tests.add("`cacheDelete` argument 1 `cache` not a `Cache` instance.", () => {
    throws(() => {
      cacheDelete(
        // @ts-expect-error Testing invalid.
        true
      );
    }, new TypeError("Argument 1 `cache` must be a `Cache` instance."));
  });

  tests.add(
    "`cacheDelete` argument 2 `cacheKeyMatcher` not a function.",
    () => {
      throws(() => {
        cacheDelete(
          new Cache(),
          // @ts-expect-error Testing invalid.
          true
        );
      }, new TypeError("Argument 2 `cacheKeyMatcher` must be a function."));
    }
  );

  tests.add("`cacheDelete` argument 2 `cacheKeyMatcher` unused.", () => {
    const cache = new Cache({ a: 1, b: 2 });

    /** @type {Array<Event>} */
    const events = [];

    /** @type {EventListener} */
    const listener = (event) => {
      events.push(event);
    };

    cache.addEventListener("a/delete", listener);
    cache.addEventListener("b/delete", listener);

    cacheDelete(cache);

    strictEqual(events.length, 2);

    assertInstanceOf(events[0], CustomEvent);
    strictEqual(events[0].type, "a/delete");
    strictEqual(events[0].cancelable, false);

    assertInstanceOf(events[1], CustomEvent);
    strictEqual(events[1].type, "b/delete");
    strictEqual(events[1].cancelable, false);

    deepStrictEqual(cache.store, {});
  });

  tests.add("`cacheDelete` argument 2 `cacheKeyMatcher` used.", () => {
    const cache = new Cache({ a: 1, b: 2, c: 3 });

    /** @type {Array<Event>} */
    const events = [];

    /** @type {EventListener} */
    const listener = (event) => {
      events.push(event);
    };

    cache.addEventListener("a/delete", listener);
    cache.addEventListener("b/delete", listener);
    cache.addEventListener("c/delete", listener);

    cacheDelete(cache, (cacheKey) => cacheKey !== "b");

    strictEqual(events.length, 2);

    assertInstanceOf(events[0], CustomEvent);
    strictEqual(events[0].type, "a/delete");
    strictEqual(events[0].cancelable, false);

    assertInstanceOf(events[1], CustomEvent);
    strictEqual(events[1].type, "c/delete");
    strictEqual(events[1].cancelable, false);

    deepStrictEqual(cache.store, { b: 2 });
  });
};
