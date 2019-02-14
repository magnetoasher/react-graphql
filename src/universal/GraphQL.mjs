import mitt from 'mitt'
import { graphqlFetchOptions } from './graphqlFetchOptions'
import { hashObject } from './hashObject'

/**
 * A lightweight GraphQL client that caches queries and mutations.
 * @kind class
 * @name GraphQL
 * @param {Object} [options={}] Options.
 * @param {GraphQLCache} [options.cache={}] Cache to import; usually from a server side render.
 * @see [`reportCacheErrors`]{@link reportCacheErrors} to setup error reporting.
 * @example <caption>Construct a GraphQL client.</caption>
 * ```js
 * import { GraphQL } from 'graphql-react'
 *
 * const graphql = new GraphQL()
 * ```
 */
export class GraphQL {
  // eslint-disable-next-line require-jsdoc
  constructor({ cache = {} } = {}) {
    const { on, off, emit } = mitt()

    /**
     * Adds an event listener.
     * @kind function
     * @name GraphQL#on
     * @param {String} type Event type.
     * @param {function} handler Event handler.
     * @see [`reportCacheErrors`]{@link reportCacheErrors} can be used with this to setup error reporting.
     */
    this.on = on

    /**
     * Removes an event listener.
     * @kind function
     * @name GraphQL#off
     * @param {String} type Event type.
     * @param {function} handler Event handler.
     */
    this.off = off

    /**
     * Emits an event with details to listeners.
     * @param {String} type Event type.
     * @param {*} [details] Event details.
     * @ignore
     */
    this.emit = emit

    /**
     * Cache of loaded GraphQL operations. You probably don’t need to interact
     * with this unless you’re implementing a server side rendering framework.
     * @kind member
     * @name GraphQL#cache
     * @type {GraphQLCache}
     * @example <caption>Export cache as JSON.</caption>
     * ```js
     * const exportedCache = JSON.stringify(graphql.cache)
     * ```
     * @example <caption>Example cache JSON.</caption>
     * ```json
     * {
     *   "a1bCd2": {
     *      "data": {
     *        "viewer": {
     *          "name": "Jayden Seric"
     *        }
     *      }
     *   }
     * }
     * ```
     */
    this.cache = cache

    /**
     * A map of loading GraphQL operations. You probably don’t need to interact
     * with this unless you’re implementing a server side rendering framework.
     * @kind member
     * @name GraphQL#operations
     * @type {Object.<GraphQLCacheKey, Promise<GraphQLCacheValue>>}
     */
    this.operations = {}
  }

  /**
   * Resets the [GraphQL cache]{@link GraphQL#cache}. Useful when a user logs
   * out.
   * @kind function
   * @name GraphQL#reset
   * @param {GraphQLCacheKey} [exceptCacheKey] A [GraphQL cache]{@link GraphQL#cache} [key]{@link GraphQLCacheKey} for cache to exempt from deletion. Useful for resetting cache after a mutation, preserving the mutation cache.
   * @example <caption>Resetting the [GraphQL cache]{@link GraphQL#cache}.</caption>
   * ```js
   * graphql.reset()
   * ```
   */
  reset = exceptCacheKey => {
    let cacheKeys = Object.keys(this.cache)

    if (exceptCacheKey)
      cacheKeys = cacheKeys.filter(hash => hash !== exceptCacheKey)

    cacheKeys.forEach(cacheKey => delete this.cache[cacheKey])

    // Emit cache updates after the entire cache has been updated, so logic in
    // listeners can assume cache for all queries is fresh and stable.
    this.emit('reset', { exceptCacheKey })
  }

  /**
   * Fetches a GraphQL operation.
   * @param {GraphQLFetchOptions} fetchOptions URL and options for [`fetch`](https://developer.mozilla.org/docs/Web/API/Fetch_API).
   * @param {GraphQLCacheKey} cacheKey [GraphQL cache]{@link GraphQL#cache} [key]{@link GraphQLCacheKey}.
   * @returns {Promise<GraphQLCacheValue>} A promise that resolves the [GraphQL cache]{@link GraphQL#cache} [value]{@link GraphQLCacheValue}.
   * @ignore
   */
  fetch = ({ url, ...options }, cacheKey) => {
    const fetcher =
      typeof fetch === 'function'
        ? fetch
        : () =>
            Promise.reject(
              new Error('Global fetch API or polyfill unavailable.')
            )
    const cacheValue = {}
    const cacheValuePromise = fetcher(url, options)
      .then(
        response => {
          if (!response.ok)
            cacheValue.httpError = {
              status: response.status,
              statusText: response.statusText
            }

          return response.json().then(
            ({ errors, data }) => {
              // JSON parse ok.
              if (!errors && !data) cacheValue.parseError = 'Malformed payload.'
              if (errors) cacheValue.graphQLErrors = errors
              if (data) cacheValue.data = data
            },
            ({ message }) => {
              // JSON parse error.
              cacheValue.parseError = message
            }
          )
        },
        ({ message }) => {
          cacheValue.fetchError = message
        }
      )
      .then(() => {
        // Cache the operation.
        this.cache[cacheKey] = cacheValue

        // Clear the loaded operation.
        delete this.operations[cacheKey]

        this.emit('cache', { cacheKey, cacheValue })

        return cacheValue
      })

    this.operations[cacheKey] = cacheValuePromise

    this.emit('fetch', { cacheKey, cacheValuePromise })

    return cacheValuePromise
  }

  /**
   * Loads or reuses an already loading GraphQL operation.
   * @kind function
   * @name GraphQL#operate
   * @param {Object} options Options.
   * @param {GraphQLOperation} options.operation GraphQL operation.
   * @param {GraphQLFetchOptionsOverride} [options.fetchOptionsOverride] Overrides default GraphQL operation [`fetch` options]{@link GraphQLFetchOptions}.
   * @param {boolean} [options.resetOnLoad=false] Should the [GraphQL cache]{@link GraphQL#cache} reset when the operation loads.
   * @returns {GraphQLOperationLoading} Loading GraphQL operation details.
   */
  operate = ({ operation, fetchOptionsOverride, resetOnLoad }) => {
    const fetchOptions = graphqlFetchOptions(operation)
    if (fetchOptionsOverride) fetchOptionsOverride(fetchOptions)
    const cacheKey = hashObject(fetchOptions)
    const cacheValuePromise =
      // Use an identical existing request or…
      this.operations[cacheKey] ||
      // …make a fresh request.
      this.fetch(fetchOptions, cacheKey)

    // Potential edge-case issue: Multiple identical queries with resetOnLoad
    // enabled will cause excessive resets.
    if (resetOnLoad) cacheValuePromise.then(() => this.reset(cacheKey))

    return {
      cacheKey,
      cacheValue: this.cache[cacheKey],
      cacheValuePromise
    }
  }
}
