import fnv1a from 'fnv1a'
import extractFiles from 'extract-files'

/**
 * A lightweight GraphQL client that caches requests.
 * @param {Object} [options={}] Options.
 * @param {Object} [options.cache={}] Cache to import; usually from a server side render.
 * @example
 * import { GraphQL } from 'graphql-react'
 *
 * const graphql = new GraphQL()
 */
export class GraphQL {
  constructor({ cache = {} } = {}) {
    /**
     * GraphQL {@link RequestCache request cache} map, keyed by {@link FetchOptions fetch options} hashes.
     * @type {Object.<string, RequestCache>}
     * @example <caption>Export cache as JSON.</caption>
     * const exportedCache = JSON.stringify(graphql.cache)
     */
    this.cache = cache
  }

  requests = {}
  listeners = {}

  /**
   * Adds a cache update listener for a request.
   * @protected
   * @param {string} fetchOptionsHash {@link FetchOptions fetch options} hash.
   * @param {CacheUpdateCallback} callback Callback.
   */
  onCacheUpdate = (fetchOptionsHash, callback) => {
    if (!this.listeners[fetchOptionsHash]) this.listeners[fetchOptionsHash] = []
    this.listeners[fetchOptionsHash].push(callback)
  }

  /**
   * Removes a cache update listener for a request.
   * @protected
   * @param {string} fetchOptionsHash {@link FetchOptions fetch options} hash.
   * @param {CacheUpdateCallback} callback Callback.
   */
  offCacheUpdate = (fetchOptionsHash, callback) => {
    if (this.listeners[fetchOptionsHash]) {
      this.listeners[fetchOptionsHash] = this.listeners[
        fetchOptionsHash
      ].filter(listenerCallback => listenerCallback !== callback)
      if (!this.listeners[fetchOptionsHash].length)
        delete this.listeners[fetchOptionsHash]
    }
  }

  /**
   * Triggers cache update listeners for a request.
   * @protected
   * @param {string} fetchOptionsHash {@link FetchOptions fetch options} hash.
   * @param {RequestCache} requestCache Request cache.
   */
  emitCacheUpdate = (fetchOptionsHash, requestCache) => {
    if (this.listeners[fetchOptionsHash])
      this.listeners[fetchOptionsHash].forEach(callback =>
        callback(requestCache)
      )
  }

  /**
   * Resets the {@link GraphQL#cache GraphQL cache}. Useful when a user logs out.
   * @param {string} [exceptFetchOptionsHash] A {@link FetchOptions fetch options} hash to exempt a request from cache deletion. Useful for resetting cache after a mutation, preserving the mutation cache.
   * @example
   * graphql.reset()
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
    fetchOptionsHashes.forEach(fetchOptionsHash =>
      this.emitCacheUpdate(fetchOptionsHash)
    )
  }

  /**
   * Derives a fetch request body from a GraphQL operation, accounting for
   * file uploads. Files are extracted from the operation, modifying the
   * operation object. See the {@link https://github.com/jaydenseric/graphql-multipart-request-spec GraphQL multipart request spec}.
   * @protected
   * @param {Operation} operation GraphQL operation.
   * @returns {string|FormData} A JSON string, or for uploads a multipart form.
   */
  static requestBody(operation) {
    const files = extractFiles(operation)
    if (files.length) {
      const form = new FormData()
      form.append('operations', JSON.stringify(operation))
      form.append(
        'map',
        JSON.stringify(
          files.reduce((map, { path }, index) => {
            map[`${index}`] = [path]
            return map
          }, {})
        )
      )
      files.forEach(({ file }, index) => form.append(index, file, file.name))
      return form
    } else return JSON.stringify(operation)
  }

  /**
   * Gets default {@link FetchOptions fetch options} for a GraphQL operation.
   * @ignore
   * @param {Operation} operation GraphQL operation.
   * @returns {FetchOptions} Fetch options.
   */
  static fetchOptions(operation) {
    const fetchOptions = {
      url: '/graphql',
      method: 'POST',
      headers: { Accept: 'application/json' }
    }

    fetchOptions.body = this.requestBody(operation)

    // Body may be a JSON string or a FormData instance.
    if (typeof fetchOptions.body === 'string')
      fetchOptions.headers['Content-Type'] = 'application/json'

    return fetchOptions
  }

  /**
   * Hashes a {@link FetchOptions fetch options} object.
   * @ignore
   * @param {FetchOptions} fetchOptions Fetch options.
   * @returns {string} A hash.
   */
  static hashFetchOptions = fetchOptions =>
    fnv1a(JSON.stringify(fetchOptions)).toString(36)

  /**
   * Executes a fetch request.
   * @ignore
   * @param {FetchOptions} fetchOptions URL and options for fetch.
   * @param {string} fetchOptionsHash {@link FetchOptions fetch options} hash.
   * @returns {RequestCachePromise} A promise that resolves the {@link RequestCache request cache}.
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
        this.emitCacheUpdate(fetchOptionsHash, requestCache)

        // Clear the done request.
        delete this.requests[fetchOptionsHash]

        return requestCache
      })
  }

  /**
   * Queries a GraphQL server.
   * @param {Object} options Options.
   * @param {Operation} options.operation GraphQL operation object.
   * @param {FetchOptionsOverride} [options.fetchOptionsOverride] Overrides default GraphQL request {@link FetchOptions fetch options}.
   * @param {boolean} [options.resetOnLoad=false] Should the {@link GraphQL#cache GraphQL cache} reset when the query loads.
   * @returns {ActiveQuery} Loading query details.
   */
  query = ({ operation, fetchOptionsOverride, resetOnLoad }) => {
    const fetchOptions = this.constructor.fetchOptions(operation)
    if (fetchOptionsOverride) fetchOptionsOverride(fetchOptions)
    const fetchOptionsHash = this.constructor.hashFetchOptions(fetchOptions)
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

/**
 * A cache update listener callback.
 * @ignore
 * @callback CacheUpdateCallback
 * @param {RequestCache} requestCache Request cache.
 */

/**
 * A GraphQL operation object. Additional properties may be used; all are sent
 * to the GraphQL server.
 * @typedef {Object} Operation
 * @prop {string} query GraphQL queries or mutations.
 * @prop {Object} variables Variables used by the query.
 */

/**
 * Fetch options for a GraphQL request. See {@link https://github.github.io/fetch/#options polyfillable fetch options}.
 * @typedef {Object} FetchOptions
 * @prop {string} url A GraphQL API URL.
 * @prop {string|FormData} body HTTP request body.
 * @prop {Object} headers HTTP request headers.
 * @prop {string} [credentials] Authentication credentials mode.
 */

/**
 * Overrides default GraphQL request {@link FetchOptions fetch options}. Modify the provided
 * options object without a return.
 * @typedef {Function} FetchOptionsOverride
 * @param {FetchOptions} fetchOptions Default GraphQL request fetch options.
 * @param {Operation} [operation] A GraphQL operation object.
 * @example
 * options => {
 *   options.url = 'https://api.example.com/graphql'
 *   options.credentials = 'include'
 * }
 */

/**
 * Loading query details.
 * @typedef {Object} ActiveQuery
 * @prop {string} fetchOptionsHash {@link FetchOptions fetch options} hash.
 * @prop {RequestCache} [cache] Results from the last identical request.
 * @prop {RequestCachePromise} request A promise that resolves fresh {@link RequestCache request cache}.
 */

/**
 * A promise for a loading query that resolves the {@link RequestCache request cache}.
 * @typedef {Promise<RequestCache>} RequestCachePromise
 */

/**
 * JSON serializable result of a GraphQL request (including all errors and data)
 * suitable for caching.
 * @typedef {Object} RequestCache
 * @prop {string} [fetchError] Fetch error message.
 * @prop {HTTPError} [httpError] Fetch response HTTP error.
 * @prop {string} [parseError] Parse error message.
 * @prop {Object} [graphQLErrors] GraphQL response errors.
 * @prop {Object} [data] GraphQL response data.
 */

/**
 * Fetch HTTP error.
 * @typedef {Object} HTTPError
 * @prop {number} status HTTP status code.
 * @prop {string} statusText HTTP status text.
 */
