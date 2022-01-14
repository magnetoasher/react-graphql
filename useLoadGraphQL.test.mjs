// @ts-check

import { deepStrictEqual, fail, strictEqual, throws } from "assert";
import {
  act,
  cleanup,
  renderHook,
  suppressErrorOutput,
} from "@testing-library/react-hooks/lib/pure.js";
import { AbortError, Response } from "node-fetch";
import React from "react";
import revertableGlobals from "revertable-globals";
import TestDirector from "test-director";
import Cache from "./Cache.mjs";
import CacheContext from "./CacheContext.mjs";
import Loading from "./Loading.mjs";
import LoadingCacheValue from "./LoadingCacheValue.mjs";
import LoadingContext from "./LoadingContext.mjs";
import cacheDelete from "./cacheDelete.mjs";
import assertBundleSize from "./test/assertBundleSize.mjs";
import assertInstanceOf from "./test/assertInstanceOf.mjs";
import assertTypeOf from "./test/assertTypeOf.mjs";
import useLoadGraphQL from "./useLoadGraphQL.mjs";

/**
 * Adds `useLoadGraphQL` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add("`useLoadGraphQL` bundle size.", async () => {
    await assertBundleSize(
      new URL("./useLoadGraphQL.mjs", import.meta.url),
      1800
    );
  });

  tests.add("`useLoadGraphQL` with cache context missing.", () => {
    try {
      const revertConsole = suppressErrorOutput();

      try {
        var { result } = renderHook(() => useLoadGraphQL());
      } finally {
        revertConsole();
      }

      deepStrictEqual(result.error, new TypeError("Cache context missing."));
    } finally {
      cleanup();
    }
  });

  tests.add(
    "`useLoadGraphQL` with cache context value not a `Cache` instance.",
    () => {
      try {
        /** @param {{ children?: React.ReactNode }} props Props. */
        const wrapper = ({ children }) =>
          React.createElement(
            CacheContext.Provider,
            {
              // @ts-expect-error Testing invalid.
              value: true,
            },
            children
          );

        const revertConsole = suppressErrorOutput();

        try {
          var { result } = renderHook(() => useLoadGraphQL(), {
            wrapper,
          });
        } finally {
          revertConsole();
        }

        deepStrictEqual(
          result.error,
          new TypeError("Cache context value must be a `Cache` instance.")
        );
      } finally {
        cleanup();
      }
    }
  );

  tests.add("`useLoadGraphQL` with loading context missing.", () => {
    try {
      const cache = new Cache();
      /** @param {{ children?: React.ReactNode }} props Props. */
      const wrapper = ({ children }) =>
        React.createElement(CacheContext.Provider, { value: cache }, children);

      const revertConsole = suppressErrorOutput();

      try {
        var { result } = renderHook(() => useLoadGraphQL(), {
          wrapper,
        });
      } finally {
        revertConsole();
      }

      deepStrictEqual(result.error, new TypeError("Loading context missing."));
    } finally {
      cleanup();
    }
  });

  tests.add(
    "`useLoadGraphQL` with loading context value not a `Loading` instance.",
    () => {
      try {
        const cache = new Cache();

        /** @param {{ children?: React.ReactNode }} props Props. */
        const wrapper = ({ children }) =>
          React.createElement(
            CacheContext.Provider,
            { value: cache },
            React.createElement(
              LoadingContext.Provider,
              {
                // @ts-expect-error Testing invalid.
                value: true,
              },
              children
            )
          );

        const revertConsole = suppressErrorOutput();

        try {
          var { result } = renderHook(() => useLoadGraphQL(), {
            wrapper,
          });
        } finally {
          revertConsole();
        }

        deepStrictEqual(
          result.error,
          new TypeError("Loading context value must be a `Loading` instance.")
        );
      } finally {
        cleanup();
      }
    }
  );

  tests.add("`useLoadGraphQL` functionality.", async () => {
    try {
      const cache = new Cache();
      const loading = new Loading();

      /** @param {{ children?: React.ReactNode }} props Props. */
      const wrapper = ({ children }) =>
        React.createElement(
          CacheContext.Provider,
          { value: cache },
          React.createElement(
            LoadingContext.Provider,
            { value: loading },
            children
          )
        );

      const { result, rerender } = renderHook(() => useLoadGraphQL(), {
        wrapper,
      });

      strictEqual(result.all.length, 1);
      assertTypeOf(result.current, "function");
      strictEqual(result.error, undefined);

      // Test that re-rendering with the same props doesn’t cause the returned
      // load GraphQL function to change.
      rerender();

      strictEqual(result.all.length, 2);
      strictEqual(result.current, result.all[0]);
      strictEqual(result.error, undefined);

      const loadGraphQLTests = new TestDirector();

      loadGraphQLTests.add(
        "Load GraphQL with argument 1 `cacheKey` not a string.",
        () => {
          throws(() => {
            result.current(
              // @ts-expect-error Testing invalid.
              true,
              "",
              {}
            );
          }, new TypeError("Argument 1 `cacheKey` must be a string."));
        }
      );

      loadGraphQLTests.add(
        "Load GraphQL with argument 2 `fetchUri` not a string.",
        () => {
          throws(() => {
            result.current(
              "a",
              // @ts-expect-error Testing invalid.
              true,
              {}
            );
          }, new TypeError("Argument 2 `fetchUri` must be a string."));
        }
      );

      loadGraphQLTests.add(
        "Load GraphQL with argument 3 `fetchOptions` not an object.",
        () => {
          throws(() => {
            result.current(
              "a",
              "",
              // @ts-expect-error Testing invalid.
              null
            );
          }, new TypeError("Argument 3 `fetchOptions` must be an object."));
        }
      );

      loadGraphQLTests.add("Load GraphQL without aborting.", async () => {
        const fetchUri = "the-uri";
        const fetchOptions = Object.freeze({ body: "a" });
        const cacheKey = "a";
        const cacheValue = {
          data: {
            a: 1,
          },
        };

        /** @type {string | undefined} */
        let fetchedUri;

        /** @type {RequestInit | undefined} */
        let fetchedOptions;

        /** @type {LoadingCacheValue | undefined} */
        let loadGraphQLReturn;

        const revertGlobals = revertableGlobals({
          /**
           * @param {string} uri Fetch URI.
           * @param {RequestInit} options Fetch options.
           */
          async fetch(uri, options) {
            fetchedUri = uri;
            fetchedOptions = options;

            return new Response(JSON.stringify(cacheValue), {
              status: 200,
              headers: {
                "Content-Type": "application/graphql+json",
              },
            });
          },
        });

        try {
          try {
            act(() => {
              loadGraphQLReturn = result.current(
                cacheKey,
                fetchUri,
                fetchOptions
              );
            });
          } finally {
            revertGlobals();
          }

          strictEqual(fetchedUri, fetchUri);
          assertTypeOf(fetchedOptions, "object");

          const { signal: fetchedOptionsSignal, ...fetchedOptionsRest } =
            fetchedOptions;

          assertInstanceOf(fetchedOptionsSignal, AbortSignal);
          deepStrictEqual(fetchedOptionsRest, fetchOptions);

          assertInstanceOf(loadGraphQLReturn, LoadingCacheValue);
          deepStrictEqual(await loadGraphQLReturn.promise, cacheValue);
          deepStrictEqual(cache.store, {
            [cacheKey]: cacheValue,
          });
        } finally {
          // Undo any cache changes for future tests.
          cacheDelete(cache);
        }
      });

      loadGraphQLTests.add(
        "Load GraphQL aborting, no fetch options `signal`.",
        async () => {
          const fetchUri = "the-uri";
          const fetchOptions = Object.freeze({ body: "a" });
          const fetchAbortError = new AbortError("The operation was aborted.");
          const cacheKey = "a";

          /** @type {string | undefined} */
          let fetchedUri;

          /** @type {RequestInit | undefined} */
          let fetchedOptions;

          /** @type {LoadingCacheValue | undefined} */
          let loadGraphQLReturn;

          const revertGlobals = revertableGlobals({
            /**
             * @param {string} uri Fetch URI.
             * @param {RequestInit} options Fetch options.
             */
            async fetch(uri, options) {
              fetchedUri = uri;
              fetchedOptions = options;

              return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(fail("Fetch wasn’t aborted."));
                }, 800);

                assertInstanceOf(options.signal, AbortSignal);

                options.signal.addEventListener(
                  "abort",
                  () => {
                    clearTimeout(timeout);
                    reject(fetchAbortError);
                  },
                  { once: true }
                );
              });
            },
          });

          try {
            try {
              act(() => {
                loadGraphQLReturn = result.current(
                  cacheKey,
                  fetchUri,
                  fetchOptions
                );
              });
            } finally {
              revertGlobals();
            }

            strictEqual(fetchedUri, fetchUri);
            assertTypeOf(fetchedOptions, "object");

            const { signal: fetchedOptionsSignal, ...fetchedOptionsRest } =
              fetchedOptions;

            assertInstanceOf(fetchedOptionsSignal, AbortSignal);
            deepStrictEqual(fetchedOptionsRest, fetchOptions);
            assertInstanceOf(loadGraphQLReturn, LoadingCacheValue);

            loadGraphQLReturn.abortController.abort();

            deepStrictEqual(await loadGraphQLReturn.promise, {
              errors: [
                {
                  message: "Fetch error.",
                  extensions: {
                    client: true,
                    code: "FETCH_ERROR",
                    fetchErrorMessage: fetchAbortError.message,
                  },
                },
              ],
            });
            deepStrictEqual(
              cache.store,
              // Cache shouldn’t be affected by aborted loading.
              {}
            );
          } finally {
            // Undo any cache changes for future tests.
            cacheDelete(cache);
          }
        }
      );

      loadGraphQLTests.add(
        "Load GraphQL aborting, fetch options `signal`, not yet aborted.",
        async () => {
          const fetchUri = "the-uri";
          const abortController = new AbortController();
          const fetchOptionsWithoutSignal = { body: "a" };
          const fetchOptions = Object.freeze({
            ...fetchOptionsWithoutSignal,
            signal: abortController.signal,
          });
          const fetchAbortError = new AbortError("The operation was aborted.");
          const cacheKey = "a";

          /** @type {string | undefined} */
          let fetchedUri;

          /** @type {RequestInit | undefined} */
          let fetchedOptions;

          /** @type {LoadingCacheValue | undefined} */
          let loadGraphQLReturn;

          const revertGlobals = revertableGlobals({
            /**
             * @param {string} uri Fetch URI.
             * @param {RequestInit} options Fetch options.
             */
            async fetch(uri, options) {
              fetchedUri = uri;
              fetchedOptions = options;

              return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(fail("Fetch wasn’t aborted."));
                }, 800);

                assertInstanceOf(options.signal, AbortSignal);

                options.signal.addEventListener(
                  "abort",
                  () => {
                    clearTimeout(timeout);
                    reject(fetchAbortError);
                  },
                  { once: true }
                );
              });
            },
          });

          try {
            try {
              act(() => {
                loadGraphQLReturn = result.current(
                  cacheKey,
                  fetchUri,
                  fetchOptions
                );
              });
            } finally {
              revertGlobals();
            }

            strictEqual(fetchedUri, fetchUri);
            assertTypeOf(fetchedOptions, "object");

            const { signal: fetchedOptionsSignal, ...fetchedOptionsRest } =
              fetchedOptions;

            assertInstanceOf(fetchedOptionsSignal, AbortSignal);
            deepStrictEqual(fetchedOptionsRest, fetchOptionsWithoutSignal);
            assertInstanceOf(loadGraphQLReturn, LoadingCacheValue);

            abortController.abort();

            deepStrictEqual(await loadGraphQLReturn.promise, {
              errors: [
                {
                  message: "Fetch error.",
                  extensions: {
                    client: true,
                    code: "FETCH_ERROR",
                    fetchErrorMessage: fetchAbortError.message,
                  },
                },
              ],
            });
            deepStrictEqual(
              cache.store,
              // Cache shouldn’t be affected by aborted loading.
              {}
            );
          } finally {
            // Undo any cache changes for future tests.
            cacheDelete(cache);
          }
        }
      );

      loadGraphQLTests.add(
        "Load GraphQL aborting, fetch options `signal`, already aborted.",
        async () => {
          const fetchUri = "the-uri";
          const abortController = new AbortController();

          abortController.abort();

          const fetchOptionsWithoutSignal = { body: "a" };
          const fetchOptions = Object.freeze({
            ...fetchOptionsWithoutSignal,
            signal: abortController.signal,
          });
          const fetchAbortError = new AbortError("The operation was aborted.");
          const cacheKey = "a";

          /** @type {string | undefined} */
          let fetchedUri;

          /** @type {RequestInit | undefined} */
          let fetchedOptions;

          /** @type {LoadingCacheValue | undefined} */
          let loadGraphQLReturn;

          const revertGlobals = revertableGlobals({
            /**
             * @param {string} uri Fetch URI.
             * @param {RequestInit} options Fetch options.
             */
            async fetch(uri, options) {
              fetchedUri = uri;
              fetchedOptions = options;

              assertInstanceOf(options.signal, AbortSignal);

              throw options.signal.aborted
                ? fetchAbortError
                : fail("Abort signal wasn’t already aborted.");
            },
          });

          try {
            try {
              act(() => {
                loadGraphQLReturn = result.current(
                  cacheKey,
                  fetchUri,
                  fetchOptions
                );
              });
            } finally {
              revertGlobals();
            }

            strictEqual(fetchedUri, fetchUri);
            assertTypeOf(fetchedOptions, "object");

            const { signal: fetchedOptionsSignal, ...fetchedOptionsRest } =
              fetchedOptions;

            assertInstanceOf(fetchedOptionsSignal, AbortSignal);
            deepStrictEqual(fetchedOptionsRest, fetchOptionsWithoutSignal);
            assertInstanceOf(loadGraphQLReturn, LoadingCacheValue);
            deepStrictEqual(await loadGraphQLReturn.promise, {
              errors: [
                {
                  message: "Fetch error.",
                  extensions: {
                    client: true,
                    code: "FETCH_ERROR",
                    fetchErrorMessage: fetchAbortError.message,
                  },
                },
              ],
            });
            deepStrictEqual(
              cache.store,
              // Cache shouldn’t be affected by aborted loading.
              {}
            );
          } finally {
            // Undo any cache changes for future tests.
            cacheDelete(cache);
          }
        }
      );

      await loadGraphQLTests.run(true);

      // No re-rendering should have happened.
      strictEqual(result.all.length, 2);
    } finally {
      cleanup();
    }
  });
};
