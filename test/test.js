import 'cross-fetch/polyfill'
import test from 'ava'
import getPort from 'get-port'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-bodyparser'
import { apolloUploadKoa, GraphQLUpload } from 'apollo-upload-server'
import * as apolloServerKoa from 'apollo-server-koa'
import * as graphqlTools from 'graphql-tools'
import React from 'react'
import { renderToString } from 'react-dom/server'
import PropTypes from 'prop-types'
import { GraphQL, Provider, Query, preload } from '../lib'

let port
let server

const typeDefs = /* GraphQL */ `
  type Query {
    date(isoDate: String!): Date!
    epoch: Date!
    daysBetween(isoDateFrom: String!, isoDateTo: String!): Int!
  }

  scalar Upload

  type Date {
    iso: String!
    year: Int!
  }
`

const resolvers = {
  Query: {
    date: (obj, { isoDate }) => new Date(isoDate),
    epoch: () => new Date(0),
    daysBetween: (obj, { isoDateFrom, isoDateTo }) =>
      Math.floor((new Date(isoDateTo) - new Date(isoDateFrom)) / 86400000)
  },
  Upload: GraphQLUpload,
  Date: {
    iso: date => date.toISOString(),
    year: date => date.getFullYear()
  }
}

const router = new Router().post(
  '/',
  koaBody(),
  async (ctx, next) => {
    if (ctx.query.bad === 'json') {
      ctx.status = 200
      ctx.type = 'txt'
      ctx.body = 'Not JSON.'
    } else if (ctx.query.bad === 'payload') {
      ctx.status = 200
      ctx.type = 'json'
      ctx.body = '[{"bad": true}]'
    } else await next()
  },
  apolloUploadKoa(),
  apolloServerKoa.graphqlKoa({
    schema: graphqlTools.makeExecutableSchema({ typeDefs, resolvers })
  })
)

const app = new Koa().use(router.routes()).use(router.allowedMethods())

const EPOCH_QUERY = /* GraphQL */ `
  {
    epoch {
      iso
    }
  }
`

const YEAR_QUERY = /* GraphQL */ `
  query($date: String!) {
    date(isoDate: $date) {
      year
    }
  }
`

test.before(async () => {
  // Setup the test GraphQL server.
  port = await getPort()
  server = await new Promise((resolve, reject) => {
    const server = app.listen(port, error => {
      if (error) reject(error)
      else resolve(server)
    })
  })
})

test('Cache export & import.', async t => {
  const graphql1 = new GraphQL()

  await graphql1.query({
    fetchOptionsOverride: options => {
      options.url = `http://localhost:${port}`
    },
    operation: {
      variables: { date: '2018-01-01' },
      query: YEAR_QUERY
    }
  }).request

  const graphql2 = new GraphQL({ cache: graphql1.cache })

  t.is(graphql1.cache, graphql2.cache)
})

test('Cache reset.', async t => {
  const graphql = new GraphQL()

  const {
    fetchOptionsHash: fetchOptionsHash1,
    request: request1
  } = await graphql.query({
    fetchOptionsOverride: options => {
      options.url = `http://localhost:${port}`
    },
    operation: {
      variables: { date: '2018-01-01' },
      query: YEAR_QUERY
    }
  })

  await request1

  const cacheBefore = JSON.stringify(graphql.cache)

  const {
    fetchOptionsHash: fetchOptionsHash2,
    request: request2
  } = graphql.query({
    fetchOptionsOverride: options => {
      options.url = `http://localhost:${port}`
    },
    variables: { date: '2018-01-02' },
    query: YEAR_QUERY
  })

  await request2

  graphql.onCacheUpdate(fetchOptionsHash1, () => t.fail())

  const request2CacheListener = new Promise(resolve => {
    graphql.onCacheUpdate(fetchOptionsHash2, resolve)
  })

  graphql.reset(fetchOptionsHash1)

  const cacheAfter = JSON.stringify(graphql.cache)

  t.falsy(await request2CacheListener)

  t.is(cacheAfter, cacheBefore)
})

test('Query with HTTP error.', async t => {
  const graphql = new GraphQL()
  const fetchOptionsOverride = options => {
    options.url = `http://localhost:${port}/404`
  }
  const requestCache = await graphql.query({
    fetchOptionsOverride,
    operation: { query: EPOCH_QUERY }
  }).request

  // Prevent the dynamic port that appears in the error message from failing
  // snapshot comparisons.
  if (typeof requestCache.parseError === 'string')
    requestCache.parseError = requestCache.parseError.replace(port, '<port>')

  t.snapshot(requestCache, 'GraphQL request cache.')

  renderToString(
    <Provider value={graphql}>
      <Query
        loadOnMount
        fetchOptionsOverride={fetchOptionsOverride}
        query={EPOCH_QUERY}
      >
        {function() {
          t.snapshot(arguments, 'Query render function arguments.')
          return null
        }}
      </Query>
    </Provider>
  )
})

test('Query with response JSON invalid.', async t => {
  const graphql = new GraphQL()
  const fetchOptionsOverride = options => {
    options.url = `http://localhost:${port}?bad=json`
  }
  const requestCache = await graphql.query({
    fetchOptionsOverride,
    operation: { query: EPOCH_QUERY }
  }).request

  // Prevent the dynamic port that appears in the error message from failing
  // snapshot comparisons.
  if (typeof requestCache.parseError === 'string')
    requestCache.parseError = requestCache.parseError.replace(port, '<port>')

  t.snapshot(requestCache, 'GraphQL request cache.')

  renderToString(
    <Provider value={graphql}>
      <Query
        loadOnMount
        fetchOptionsOverride={fetchOptionsOverride}
        query={EPOCH_QUERY}
      >
        {function() {
          t.snapshot(arguments, 'Query render function arguments.')
          return null
        }}
      </Query>
    </Provider>
  )
})

test('Query with response payload malformed.', async t => {
  const graphql = new GraphQL()
  const fetchOptionsOverride = options => {
    options.url = `http://localhost:${port}?bad=payload`
  }
  const requestCache = await graphql.query({
    fetchOptionsOverride,
    operation: { query: EPOCH_QUERY }
  }).request

  t.snapshot(requestCache, 'GraphQL request cache.')

  renderToString(
    <Provider value={graphql}>
      <Query
        loadOnMount
        fetchOptionsOverride={fetchOptionsOverride}
        query={EPOCH_QUERY}
      >
        {function() {
          t.snapshot(arguments, 'Query render function arguments.')
          return null
        }}
      </Query>
    </Provider>
  )
})

test('Query with GraphQL errors.', async t => {
  const graphql = new GraphQL()
  const fetchOptionsOverride = options => {
    options.url = `http://localhost:${port}`
  }

  const query = 'x'

  const requestCache = await graphql.query({
    fetchOptionsOverride,
    operation: { query }
  }).request

  t.snapshot(requestCache, 'GraphQL request cache.')

  renderToString(
    <Provider value={graphql}>
      <Query
        loadOnMount
        fetchOptionsOverride={fetchOptionsOverride}
        query={query}
      >
        {function() {
          t.snapshot(arguments, 'Query render function arguments.')
          return null
        }}
      </Query>
    </Provider>
  )
})

test('Query with variables.', async t => {
  const graphql = new GraphQL()
  const fetchOptionsOverride = options => {
    options.url = `http://localhost:${port}`
  }

  const variables = { date: '2018-01-01' }
  const query = YEAR_QUERY

  const requestCache = await graphql.query({
    fetchOptionsOverride,
    operation: { variables, query }
  }).request

  t.snapshot(requestCache, 'GraphQL request cache.')

  renderToString(
    <Provider value={graphql}>
      <Query
        loadOnMount
        fetchOptionsOverride={fetchOptionsOverride}
        variables={variables}
        query={query}
      >
        {function() {
          t.snapshot(arguments, 'Query render function arguments.')
          return null
        }}
      </Query>
    </Provider>
  )
})

test('Server side render nested queries.', async t => {
  const graphql = new GraphQL()
  const fetchOptionsOverride = options => {
    options.url = `http://localhost:${port}`
  }
  const tree = (
    <Provider value={graphql}>
      <Query
        loadOnMount
        fetchOptionsOverride={fetchOptionsOverride}
        query={EPOCH_QUERY}
      >
        {({ data: { epoch: { iso } } }) => (
          <Query
            loadOnMount
            fetchOptionsOverride={fetchOptionsOverride}
            variables={{ isoDateFrom: iso }}
            query={
              /* GraphQL */ `
                query($isoDateFrom: String!) {
                  daysBetween(
                    isoDateFrom: $isoDateFrom,
                    isoDateTo: "2018-01-01"
                  )
                }
              `
            }
          >
            {result => (
              <pre
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(result)
                }}
              />
            )}
          </Query>
        )}
      </Query>
    </Provider>
  )

  await preload(tree)

  t.snapshot(
    renderToString(tree),
    'HTML displaying the nested query render function argument.'
  )
})

test('Preload legacy React context API components.', async t => {
  class LegacyContextProvider extends React.Component {
    static propTypes = {
      value: PropTypes.string,
      children: PropTypes.node
    }

    static childContextTypes = {
      value: PropTypes.string
    }

    getChildContext() {
      return { value: this.props.value }
    }

    render() {
      return <div>{this.props.children}</div>
    }
  }

  class LegacyContextConsumer extends React.Component {
    static contextTypes = {
      value: PropTypes.string
    }

    render() {
      return <p>{this.context.value}</p>
    }
  }

  const tree = (
    <LegacyContextProvider value="Context value.">
      <div>
        <LegacyContextConsumer />
      </div>
    </LegacyContextProvider>
  )

  t.snapshot(renderToString(tree), 'HTML.')

  await t.notThrows(async () => {
    await preload(tree)
  })
})

test.after(() =>
  // Close the test GraphQL server.
  server.close()
)
