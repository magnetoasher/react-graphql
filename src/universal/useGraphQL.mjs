import React from 'react'
import { GraphQL } from './GraphQL'
import { GraphQLContext } from './GraphQLContext'
import { graphqlFetchOptions } from './graphqlFetchOptions'
import { hashObject } from './hashObject'

/**
 * A [React hook](https://reactjs.org/docs/hooks-intro) to manage a GraphQL
 * operation in a component.
 * @kind function
 * @name useGraphQL
 * @param {Object} options Options.
 * @param {GraphQLFetchOptionsOverride} [options.fetchOptionsOverride] Overrides default [`fetch` options]{@link GraphQLFetchOptions} for the GraphQL operation.
 * @param {boolean} [options.loadOnMount=true] Should the operation load when the component mounts.
 * @param {boolean} [options.loadOnReload=true] Should the operation load when the [`GraphQL`]{@link GraphQL} `reload` event fires, if the operation was not the one that caused the reload.
 * @param {boolean} [options.loadOnReset=true] Should the operation load when its [GraphQL cache]{@link GraphQL#cache} [value]{@link GraphQLCacheValue} is reset, if the operation was not the one that caused the reset.
 * @param {boolean} [options.reloadOnLoad=false] Should a [GraphQL reload]{@link GraphQL#reload} happen after the operation loads, excluding the loaded operation cache.
 * @param {boolean} [options.resetOnLoad=false] Should a [GraphQL reset]{@link GraphQL#reset} happen after the operation loads, excluding the loaded operation cache.
 * @param {GraphQLOperation} options.operation GraphQL operation.
 * @returns {GraphQLOperationStatus} GraphQL operation status.
 * @see [`GraphQLContext`]{@link GraphQLContext} `Provider`; required for [`useGraphQL`]{@link useGraphQL} to work.
 * @example <caption>A component that displays a Pokémon image.</caption>
 * ```jsx
 * import { useGraphQL } from 'graphql-react'
 *
 * const PokemonImage = ({ name }) => {
 *  const { loading, cacheValue = {} } = useGraphQL({
 *    fetchOptionsOverride(options) {
 *      options.url = 'https://graphql-pokemon.now.sh'
 *    },
 *    operation: {
 *      query: `{ pokemon(name: "${name}") { image } }`
 *    }
 *  })
 *
 *  return cacheValue.data ? (
 *    <img src={cacheValue.data.pokemon.image} alt={name} />
 *  ) : loading ? (
 *    'Loading…'
 *  ) : (
 *    'Error!'
 *  )
 *}
 * ```
 */
export const useGraphQL = ({
  fetchOptionsOverride,
  loadOnMount = true,
  loadOnReload = true,
  loadOnReset = true,
  reloadOnLoad = false,
  resetOnLoad = false,
  operation
}) => {
  if (reloadOnLoad && resetOnLoad)
    throw new Error(
      'useGraphQL() options “reloadOnLoad” and “resetOnLoad” can’t both be true.'
    )

  const graphql = React.useContext(GraphQLContext)

  if (typeof graphql === 'undefined')
    throw new Error('GraphQL context missing.')

  if (!(graphql instanceof GraphQL))
    throw new Error('GraphQL context must be a GraphQL instance.')

  const fetchOptions = graphqlFetchOptions(operation)
  if (fetchOptionsOverride) fetchOptionsOverride(fetchOptions)

  const fetchOptionsHash = hashObject(fetchOptions)

  let [cacheKey, setCacheKey] = React.useState(fetchOptionsHash)
  let [cacheValue, setCacheValue] = React.useState(graphql.cache[cacheKey])
  let [loading, setLoading] = React.useState(cacheKey in graphql.operations)

  // If the GraphQL operation or its fetch options change after the initial
  // render the state has to be re-initialized.
  if (cacheKey !== fetchOptionsHash) {
    setCacheKey((cacheKey = fetchOptionsHash))
    setCacheValue((cacheValue = graphql.cache[cacheKey]))
    setLoading((loading = cacheKey in graphql.operations))
  }

  /**
   * Loads the GraphQL query, updating state.
   * @returns {Promise<GraphQLCacheValue>} Resolves the loaded [GraphQL cache]{@link GraphQLCache} [value]{@link GraphQLCacheValue}.
   * @ignore
   */
  const load = React.useCallback(() => {
    const { cacheKey, cacheValue, cacheValuePromise } = graphql.operate({
      operation,
      fetchOptionsOverride,
      reloadOnLoad,
      resetOnLoad
    })

    setLoading(true)
    setCacheKey(cacheKey)
    setCacheValue(cacheValue)

    return cacheValuePromise
  }, [fetchOptionsOverride, graphql, operation, reloadOnLoad, resetOnLoad])

  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true

    /**
     * Handles a [`GraphQL`]{@link GraphQL} `fetch` event.
     * @ignore
     */
    function onFetch({ cacheKey: fetchingCacheKey }) {
      if (cacheKey === fetchingCacheKey && isMountedRef.current)
        setLoading(true)
    }

    /**
     * Handles a [`GraphQL`]{@link GraphQL} `cache` event.
     * @ignore
     */
    function onCache({ cacheKey: cachedCacheKey, cacheValue }) {
      if (cacheKey === cachedCacheKey && isMountedRef.current) {
        setLoading(false)
        setCacheValue(cacheValue)
      }
    }

    /**
     * Handles a [`GraphQL`]{@link GraphQL} `reload` event.
     * @ignore
     */
    function onReload({ exceptCacheKey }) {
      if (cacheKey !== exceptCacheKey && loadOnReload && isMountedRef.current)
        load()
    }

    /**
     * Handles a [`GraphQL`]{@link GraphQL} `reset` event.
     * @ignore
     */
    function onReset({ exceptCacheKey }) {
      if (cacheKey !== exceptCacheKey && isMountedRef.current)
        if (loadOnReset) load()
        else setCacheValue(graphql.cache[cacheKey])
    }

    graphql.on('fetch', onFetch)
    graphql.on('cache', onCache)
    graphql.on('reload', onReload)
    graphql.on('reset', onReset)

    return () => {
      isMountedRef.current = false

      graphql.off('fetch', onFetch)
      graphql.off('cache', onCache)
      graphql.off('reload', onReload)
      graphql.off('reset', onReset)
    }
  }, [cacheKey, graphql, load, loadOnReload, loadOnReset])

  const [loadedOnMountCacheKey, setLoadedOnMountCacheKey] = React.useState()

  React.useEffect(() => {
    if (loadOnMount && cacheKey !== loadedOnMountCacheKey) {
      setLoadedOnMountCacheKey(cacheKey)
      load()
    }
  }, [cacheKey, load, loadOnMount, loadedOnMountCacheKey])

  if (graphql.ssr && loadOnMount && !cacheValue)
    graphql.operate({
      operation,
      fetchOptionsOverride,
      reloadOnLoad,
      resetOnLoad
    })

  return { load, loading, cacheKey, cacheValue }
}
