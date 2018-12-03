import mitt from 'mitt'
import { graphqlFetchOptions } from './graphqlFetchOptions'
import { hashObject } from './hashObject'

/**
 * A lightweight GraphQL client that caches requests.
 * @kind class
 * @name GraphQL
 * @param {Object} [options={}] Options.
 * @param {Object} [options.cache={}] Cache to import; usually from a server side render.
 * @param {boolean} [options.logErrors=true] Should GraphQL request errors be console logged for easy debugging.
 * @example <caption>Constructing a new GraphQL client.</caption>
 * ```js
 * import { GraphQL } from 'graphql-react'
 *
 * const graphql = new GraphQL()
 * ```
 */
export class GraphQL {
  // eslint-disable-next-line require-jsdoc
  constructor({ cache = {}, logErrors = true } = {}) {
    const { on, off, emit } = mitt()

    /**
     * Adds an event listener.
     * @kind function
     * @name GraphQL#on
     * @param {String} type Event type.
     * @param {function} handler Event handler.
     * @ignore
     */
    this.on = on

    /**
     * Removes an event listener.
     * @kind function
     * @name GraphQL#off
     * @param {String} type Event type.
     * @param {function} handler Event handler.
     * @ignore
     */
    this.off = off

    /**
     * Emits an event with details to listeners.
     * @kind function
     * @name GraphQL#emit
     * @param {String} type Event type.
     * @param {*} [details] Event details.
     * @ignore
     */
    this.emit = emit

    /**
     * GraphQL [request cache]{@link RequestCache} map, keyed by
     * [fetch options]{@link FetchOptions} hashes.
     * @kind member
     * @name GraphQL#cache
     * @type {Object.<string, RequestCache>}
     * @example <caption>Export cache as JSON.</caption>
     * ```js
     * const exportedCache = JSON.stringify(graphql.cache)
     * ```
     */
    this.cache = cache

    /**
     * Loading requests.
     * @kind member
     * @name GraphQL#requests
     * @type {Promise<RequestCache>}
     * @ignore
     */
    this.requests = {}

    /**
     * Should GraphQL request errors be logged. May be toggled at runtime.
     * @kind member
     * @name GraphQL#logErrors
     * @type {Boolean}
     */
    this.logErrors = logErrors
  }

  /**
   * Resets the [GraphQL cache]{@link GraphQL#cache}. Useful when a user logs
   * out.
   * @kind function
   * @name GraphQL#reset
   * @param {string} [exceptFetchOptionsHash] A [fetch options]{@link FetchOptions} hash for cache to exempt from deletion. Useful for resetting cache after a mutation, preserving the mutation cache.
   * @example <caption>Resetting the GraphQL cache.</caption>
   * ```js
   * graphql.reset()
   * ```
   */
  reset = exceptFetchOptionsHash => {
    let fetchOptionsHashes = Object.keys(this.cache)

    if (exceptFetchOptionsHash)
      fetchOptionsHashes = fetchOptionsHashes.filter(
        hash => hash !== exceptFetchOptionsHash
      )

    fetchOptionsHashes.forEach(
      fetchOptionsHash => delete this.cache[fetchOptionsHash]
    )

    // Emit cache updates after the entire cache has been updated, so logic in
    // listeners can assume cache for all requests is fresh and stable.
    this.emit('reset', { exceptFetchOptionsHash })
  }

  /**
   * Executes a fetch request.
   * @kind function
   * @name GraphQL#request
   * @param {FetchOptions} fetchOptions URL and options for fetch.
   * @param {string} fetchOptionsHash [fetch options]{@link FetchOptions} hash.
   * @returns {Promise<RequestCache>} A promise that resolves the [request cache]{@link RequestCache}.
   * @ignore
   */
  request = ({ url, ...options }, fetchOptionsHash) => {
    const requestCache = {}
    const fetcher =
      typeof fetch === 'function'
        ? fetch
        : () =>
            Promise.reject(
              new Error('Global fetch API or polyfill unavailable.')
            )

    this.emit('fetch', { fetchOptionsHash })

    return (this.requests[fetchOptionsHash] = fetcher(url, options))
      .then(
        response => {
          if (!response.ok)
            requestCache.httpError = {
              status: response.status,
              statusText: response.statusText
            }

          return response.json().then(
            ({ errors, data }) => {
              // JSON parse ok.
              if (!errors && !data)
                requestCache.parseError = 'Malformed payload.'
              if (errors) requestCache.graphQLErrors = errors
              if (data) requestCache.data = data
            },
            ({ message }) => {
              // JSON parse error.
              requestCache.parseError = message
            }
          )
        },
        ({ message }) => {
          requestCache.fetchError = message
        }
      )
      .then(() => {
        // Cache the request.
        this.cache[fetchOptionsHash] = requestCache

        // Clear the done request.
        delete this.requests[fetchOptionsHash]

        this.emit('cache', { fetchOptionsHash })

        const {
          fetchError,
          httpError,
          parseError,
          graphQLErrors
        } = requestCache

        if (
          this.logErrors &&
          (fetchError || httpError || parseError || graphQLErrors)
        ) {
          // eslint-disable-next-line no-console
          console.groupCollapsed(
            `GraphQL request (hash “${fetchOptionsHash}”) errors:`
          )

          if (fetchError) {
            // eslint-disable-next-line no-console
            console.groupCollapsed('Fetch:')

            // eslint-disable-next-line no-console
            console.log(fetchError)

            // eslint-disable-next-line no-console
            console.groupEnd()
          }

          if (httpError) {
            // eslint-disable-next-line no-console
            console.groupCollapsed('HTTP:')

            // eslint-disable-next-line no-console
            console.log(`Status: ${httpError.status}`)

            // eslint-disable-next-line no-console
            console.log(`Text: ${httpError.statusText}`)

            // eslint-disable-next-line no-console
            console.groupEnd()
          }

          if (parseError) {
            // eslint-disable-next-line no-console
            console.groupCollapsed('Parse:')

            // eslint-disable-next-line no-console
            console.log(parseError)

            // eslint-disable-next-line no-console
            console.groupEnd()
          }

          if (graphQLErrors) {
            // eslint-disable-next-line no-console
            console.groupCollapsed('GraphQL:')

            graphQLErrors.forEach(({ message }) =>
              // eslint-disable-next-line no-console
              console.log(message)
            )

            // eslint-disable-next-line no-console
            console.groupEnd()
          }

          // eslint-disable-next-line no-console
          console.groupEnd()
        }

        return requestCache
      })
  }

  /**
   * Queries a GraphQL server.
   * @kind function
   * @name GraphQL#query
   * @param {Object} options Options.
   * @param {GraphQLOperation} options.operation GraphQL operation.
   * @param {FetchOptionsOverride} [options.fetchOptionsOverride] Overrides default GraphQL request [fetch options]{@link FetchOptions}.
   * @param {boolean} [options.resetOnLoad=false] Should the [GraphQL cache]{@link GraphQL#cache} reset when the query loads.
   * @returns {ActiveQuery} Loading query details.
   */
  query = ({ operation, fetchOptionsOverride, resetOnLoad }) => {
    const fetchOptions = graphqlFetchOptions(operation)
    if (fetchOptionsOverride) fetchOptionsOverride(fetchOptions)
    const fetchOptionsHash = hashObject(fetchOptions)
    const request =
      // Use an identical active request or…
      this.requests[fetchOptionsHash] ||
      // …make a fresh request.
      this.request(fetchOptions, fetchOptionsHash)

    // Potential edge-case issue: Multiple identical request queries with
    // resetOnLoad enabled will cause excessive resets.
    if (resetOnLoad) request.then(() => this.reset(fetchOptionsHash))

    return {
      fetchOptionsHash,
      cache: this.cache[fetchOptionsHash],
      request
    }
  }
}
