import { deepStrictEqual, strictEqual, throws } from "assert";
import Cache from "./Cache.mjs";
import cacheEntryPrune from "./cacheEntryPrune.mjs";
import assertBundleSize from "./test/assertBundleSize.mjs";

export default (tests) => {
  tests.add("`cacheEntryPrune` bundle size.", async () => {
    await assertBundleSize(
      new URL("./cacheEntryPrune.mjs", import.meta.url),
      350
    );
  });

  tests.add(
    "`cacheEntryPrune` argument 1 `cache` not a `Cache` instance.",
    () => {
      throws(() => {
        cacheEntryPrune(true);
      }, new TypeError("Argument 1 `cache` must be a `Cache` instance."));
    }
  );

  tests.add("`cacheEntryPrune` argument 2 `cacheKey` not a string.", () => {
    throws(() => {
      cacheEntryPrune(new Cache(), true);
    }, new TypeError("Argument 2 `cacheKey` must be a string."));
  });

  tests.add("`cacheEntryPrune` with entry not populated.", () => {
    const initialCacheStore = { a: 1 };
    const cache = new Cache({ ...initialCacheStore });
    const events = [];
    const listener = (event) => {
      events.push(event);
    };

    cache.addEventListener("b/prune", listener);
    cache.addEventListener("b/delete", listener);

    cacheEntryPrune(cache, "b");

    deepStrictEqual(events, []);
    deepStrictEqual(cache.store, initialCacheStore);
  });

  tests.add(
    "`cacheEntryPrune` with entry populated, prune event not canceled.",
    () => {
      const pruneCacheKey = "b";
      const cache = new Cache({ a: 1, [pruneCacheKey]: 2 });
      const events = [];
      const listener = (event) => {
        events.push(event);
      };

      cache.addEventListener(`${pruneCacheKey}/prune`, listener);
      cache.addEventListener(`${pruneCacheKey}/delete`, listener);

      cacheEntryPrune(cache, pruneCacheKey);

      strictEqual(events.length, 2);

      strictEqual(events[0] instanceof CustomEvent, true);
      strictEqual(events[0].type, `${pruneCacheKey}/prune`);
      strictEqual(events[0].cancelable, true);
      strictEqual(events[0].defaultPrevented, false);

      strictEqual(events[1] instanceof CustomEvent, true);
      strictEqual(events[1].type, `${pruneCacheKey}/delete`);
      strictEqual(events[1].cancelable, false);

      deepStrictEqual(cache.store, { a: 1 });
    }
  );

  tests.add(
    "`cacheEntryPrune` with entry populated, prune event canceled.",
    () => {
      const pruneCacheKey = "b";
      const initialCacheStore = { a: 1, [pruneCacheKey]: 2 };
      const cache = new Cache({ ...initialCacheStore });
      const events = [];

      cache.addEventListener(`${pruneCacheKey}/prune`, (event) => {
        event.preventDefault();
        events.push(event);
      });
      cache.addEventListener(`${pruneCacheKey}/delete`, (event) => {
        events.push(event);
      });

      cacheEntryPrune(cache, pruneCacheKey);

      strictEqual(events.length, 1);

      strictEqual(events[0] instanceof CustomEvent, true);
      strictEqual(events[0].type, `${pruneCacheKey}/prune`);
      strictEqual(events[0].cancelable, true);
      strictEqual(events[0].defaultPrevented, true);

      deepStrictEqual(cache.store, initialCacheStore);
    }
  );
};
