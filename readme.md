![graphql-react logo](https://cdn.rawgit.com/jaydenseric/graphql-react/b2e60e80/graphql-react-logo.svg)

# graphql-react

[![npm version](https://img.shields.io/npm/v/graphql-react.svg)](https://npm.im/graphql-react) ![Licence](https://img.shields.io/npm/l/graphql-react.svg) [![Github issues](https://img.shields.io/github/issues/jaydenseric/graphql-react.svg)](https://github.com/jaydenseric/graphql-react/issues) [![Github stars](https://img.shields.io/github/stars/jaydenseric/graphql-react.svg)](https://github.com/jaydenseric/graphql-react/stargazers) [![Travis status](https://img.shields.io/travis/jaydenseric/graphql-react.svg)](https://travis-ci.org/jaydenseric/graphql-react)

A lightweight GraphQL client for React; the first Relay and Apollo alternative with server side rendering.

### Easy 🔥

- Add 1 dependency to get started with GraphQL in a React project.
- No Webpack or Babel setup.
- Simple components, no decorators.
- Query components fetch on mount and when props change. While loading, cache from the last identical request is available to display.
- Automatically fresh cache, even after mutations.
- Use file input values as mutation arguments to upload files; compatible with [a variety of servers](https://github.com/jaydenseric/graphql-multipart-request-spec#server).
- [Template literal](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) queries; no need for [`gql`](https://github.com/apollographql/graphql-tag#gql).
- Query multiple GraphQL APIs.

### Smart 💡

- Adds only a few KB to a typical min+gzip bundle.
- [Native ESM in Node.js](https://nodejs.org/api/esm.html) via `.mjs`.
- [Package `module` entry](https://github.com/rollup/rollup/wiki/pkg.module) for [tree shaking](https://developer.mozilla.org/docs/Glossary/Tree_shaking) bundlers.
- Server side rendering for crawlable pages and a better UX.
- Components use the [React v16.3 context API](https://github.com/facebook/react/pull/11818).
- **_All_** fetch options overridable per request.
- GraphQL request fetch options hash based cache:
  - No data denormalization or need to query `id` fields.
  - No tampering with queries or `__typename` insertion.
  - Errors are cached and can be server side rendered.
  - Query multiple GraphQL APIs without stitching data.

## Setup

To install [`graphql-react`](https://npm.im/graphql-react) from [npm](https://npmjs.com) run:

```sh
npm install graphql-react
```

Create and provide a [GraphQL](#graphql) client:

```jsx
import { GraphQL, Provider } from 'graphql-react'

const graphql = new GraphQL()

const Page = () => (
  <Provider value={graphql}>Use Consumer or Query components…</Provider>
)
```

## Example

See the [example GraphQL API and Next.js web app](https://github.com/jaydenseric/graphql-react-examples), deployed at [graphql-react.now.sh](https://graphql-react.now.sh).

## Support

- Node.js v8.5+.
- Browsers [>1% usage](http://browserl.ist/?q=%3E1%25).

Consider polyfilling:

- [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [`fetch`](https://developer.mozilla.org/docs/Web/API/Fetch_API)

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [GraphQL](#graphql)
  - [Parameters](#parameters)
  - [Examples](#examples)
  - [cache](#cache)
    - [Examples](#examples-1)
  - [query](#query)
    - [Parameters](#parameters-1)
  - [reset](#reset)
    - [Parameters](#parameters-2)
    - [Examples](#examples-2)
- [Provider](#provider)
  - [Parameters](#parameters-3)
  - [Examples](#examples-3)
- [Consumer](#consumer)
  - [Parameters](#parameters-4)
  - [Examples](#examples-4)
- [Query](#query-1)
  - [Parameters](#parameters-5)
  - [Examples](#examples-5)
- [preload](#preload)
  - [Parameters](#parameters-6)
  - [Examples](#examples-6)
- [Types](#types)
  - [ConsumerRender](#consumerrender)
    - [Parameters](#parameters-7)
    - [Examples](#examples-7)
  - [QueryRender](#queryrender)
    - [Parameters](#parameters-8)
    - [Examples](#examples-8)
  - [Operation](#operation)
    - [Properties](#properties)
  - [FetchOptions](#fetchoptions)
    - [Properties](#properties-1)
  - [FetchOptionsOverride](#fetchoptionsoverride)
    - [Parameters](#parameters-9)
    - [Examples](#examples-9)
  - [ActiveQuery](#activequery)
    - [Properties](#properties-2)
  - [RequestCache](#requestcache)
    - [Properties](#properties-3)
  - [HttpError](#httperror)
    - [Properties](#properties-4)

### GraphQL

A lightweight GraphQL client that caches requests.

#### Parameters

- `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Options. (optional, default `{}`)
  - `options.cache` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Cache to import; usually from a server side render. (optional, default `{}`)

#### Examples

```javascript
import { GraphQL } from 'graphql-react'

const graphql = new GraphQL()
```

#### cache

GraphQL [request cache](#requestcache) map, keyed by [fetch options](#fetchoptions) hashes.

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), [RequestCache](#requestcache)>

##### Examples

_Export cache as JSON._

```javascript
const exportedCache = JSON.stringify(graphql.cache)
```

#### query

Queries a GraphQL server.

##### Parameters

- `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Options.
  - `options.operation` **[Operation](#operation)** GraphQL operation object.
  - `options.fetchOptionsOverride` **[FetchOptionsOverride](#fetchoptionsoverride)?** Overrides default GraphQL request [fetch options](#fetchoptions).
  - `options.resetOnLoad` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Should the [GraphQL cache](#graphqlcache) reset when the query loads. (optional, default `false`)

Returns **[ActiveQuery](#activequery)** Loading query details.

#### reset

Resets the [GraphQL cache](#graphqlcache). Useful when a user logs out.

##### Parameters

- `exceptFetchOptionsHash` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** A [fetch options](#fetchoptions) hash to exempt a request from cache deletion. Useful for resetting cache after a mutation, preserving the mutation cache.

##### Examples

```javascript
graphql.reset()
```

### Provider

A React component provides a [GraphQL](#graphql) instance in context for nested [Consumer](#consumer) components to use.

#### Parameters

- `value` **[GraphQL](#graphql)** A [GraphQL](#graphql) instance.
- `children` **ReactNode** A React node.

#### Examples

```javascript
import { GraphQL, Provider } from 'graphql-react'

const graphql = new GraphQL()

const Page = () => (
  <Provider value={graphql}>Use Consumer or Query components…</Provider>
)
```

Returns **ReactElement** React virtual DOM element.

### Consumer

A React component that gets the [GraphQL](#graphql) instance from context.

#### Parameters

- `children` **[ConsumerRender](#consumerrender)** Render function that receives a [GraphQL](#graphql) instance.

#### Examples

_A button component that resets the [GraphQL cache](#graphqlcache)._

```javascript
import { Consumer } from 'graphql-react'

const ResetCacheButton = () => (
  <Consumer>
    {graphql => <button onClick={graphql.reset}>Reset cache</button>}
  </Consumer>
)
```

Returns **ReactElement** React virtual DOM element.

### Query

A React component to manage a GraphQL query or mutation.

#### Parameters

- `props` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Component props.
  - `props.variables` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** GraphQL query variables.
  - `props.query` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GraphQL query.
  - `props.fetchOptionsOverride` **[FetchOptionsOverride](#fetchoptionsoverride)?** Overrides default GraphQL request [fetch options](#fetchoptions).
  - `props.loadOnMount` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Should the query load when the component mounts. (optional, default `false`)
  - `props.loadOnReset` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Should the query load when the [GraphQL cache](#graphqlcache) is reset. (optional, default `false`)
  - `props.resetOnLoad` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Should the [GraphQL cache](#graphqlcache) reset when the query loads. (optional, default `false`)
  - `props.children` **[QueryRender](#queryrender)** Renders the query status.

#### Examples

_A query to display a user profile._

```javascript
import { Query } from 'graphql-react'

const Profile = ({ userId }) => (
  <Query
    loadOnMount
    loadOnReset
    fetchOptionsOverride={options => {
      options.url = 'https://api.example.com/graphql'
    }}
    variables={{ userId }}
    query={`
      query user($userId: ID!) {
        user(userId: $id) {
          name
        }
      }
    `}
  >
    {({
      load,
      loading,
      fetchError,
      httpError,
      parseError,
      graphQLErrors,
      data
    }) => (
      <article>
        <button onClick={load}>Reload</button>
        {loading && <span>Loading…</span>}
        {(fetchError || httpError || parseError || graphQLErrors) && (
          <strong>Error!</strong>
        )}
        {data && <h1>{data.user.name}</h1>}
      </article>
    )}
  </Query>
)
```

_A mutation to clap an article._

```javascript
import { Query } from 'graphql-react'

const ClapArticleButton = ({ articleId }) => (
  <Query
    resetOnLoad
    fetchOptionsOverride={options => {
      options.url = 'https://api.example.com/graphql'
    }}
    variables={{ articleId }}
    query={`
      mutation clapArticle($articleId: ID!) {
        clapArticle(articleId: $id) {
          clapCount
        }
      }
    `}
  >
    {({
      load,
      loading,
      fetchError,
      httpError,
      parseError,
      graphQLErrors,
      data
    }) => (
      <aside>
        <button onClick={load} disabled={loading}>
          Clap
        </button>
        {(fetchError || httpError || parseError || graphQLErrors) && (
          <strong>Error!</strong>
        )}
        {data && <p>Clapped {data.clapArticle.clapCount} times.</p>}
      </aside>
    )}
  </Query>
)
```

Returns **ReactElement** React virtual DOM element.

### preload

Recursively preloads [Query](#query) components that have the `loadOnMount` prop in a React element tree. Useful for server side rendering (SSR) or to preload components for a better user experience when they mount.

#### Parameters

- `element` **ReactElement** A React virtual DOM element.

#### Examples

_An async SSR function that returns a HTML string and cache JSON for client hydration._

```javascript
import { GraphQL, preload, Provider } from 'graphql-react'
import { renderToString } from 'react-dom/server'
import { App } from './components'

const graphql = new GraphQL()
const page = (
  <Provider value={graphql}>
    <App />
  </Provider>
)

export async function ssr() {
  await preload(page)
  return {
    cache: JSON.stringify(graphql.cache),
    html: renderToString(page)
  }
}
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolves once loading is done and cache is ready to be exported from the [GraphQL](#graphql) instance. Cache can be imported when constructing new [GraphQL](#graphql) instances.

### Types

The following types are for documentation only and are not exported.

#### ConsumerRender

Renders a [GraphQL](#graphql) consumer.

Type: [Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)

##### Parameters

- `graphql` **[GraphQL](#graphql)** [GraphQL](#graphql) instance.

##### Examples

_A button that resets the [GraphQL cache](#graphqlcache)._

```javascript
graphql => <button onClick={graphql.reset}>Reset cache</button>
```

Returns **ReactElement** React virtual DOM element.

#### QueryRender

Renders the status of a query or mutation.

Type: [Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)

##### Parameters

- `load` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** Loads the query on demand, updating cache.
- `loading` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Is the query loading.
- `fetchError` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Fetch error message.
- `httpError` **HTTPError?** Fetch response HTTP error.
- `parseError` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Parse error message.
- `graphQLErrors` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** GraphQL response errors.
- `data` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** GraphQL response data.

##### Examples

```javascript
;({
  load,
  loading,
  fetchError,
  httpError,
  parseError,
  graphQLErrors,
  data
}) => (
  <aside>
    <button onClick={load}>Reload</button>
    {loading && <span>Loading…</span>}
    {(fetchError || httpError || parseError || graphQLErrors) && (
      <strong>Error!</strong>
    )}
    {data && <h1>{data.user.name}</h1>}
  </aside>
)
```

Returns **ReactElement** React virtual DOM element.

#### Operation

A GraphQL operation object. Additional properties may be used; all are sent to the GraphQL server.

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

##### Properties

- `query` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GraphQL queries or mutations.
- `variables` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Variables used by the query.

#### FetchOptions

Fetch options for a GraphQL request. See [polyfillable fetch options](https://github.github.io/fetch/#options).

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

##### Properties

- `url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** A GraphQL API URL.
- `body` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [FormData](https://developer.mozilla.org/docs/Web/API/FormData))** HTTP request body.
- `headers` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** HTTP request headers.
- `credentials` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Authentication credentials mode.

#### FetchOptionsOverride

Overrides default GraphQL request [fetch options](#fetchoptions). Modify the provided options object without a return.

Type: [Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)

##### Parameters

- `fetchOptions` **[FetchOptions](#fetchoptions)** Default GraphQL request fetch options.
- `operation` **[Operation](#operation)?** A GraphQL operation object.

##### Examples

```javascript
options => {
  options.url = 'https://api.example.com/graphql'
  options.credentials = 'include'
}
```

#### ActiveQuery

Loading query details.

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

##### Properties

- `fetchOptionsHash` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** [fetch options](#fetchoptions) hash.
- `cache` **[RequestCache](#requestcache)?** Results from the last identical request.
- `request` **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[RequestCache](#requestcache)>** A promise that resolves fresh [request cache](#requestcache).

#### RequestCache

JSON serializable result of a GraphQL request (including all errors and data) suitable for caching.

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

##### Properties

- `fetchError` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Fetch error message.
- `httpError` **[HttpError](#httperror)?** Fetch response HTTP error.
- `parseError` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Parse error message.
- `graphQLErrors` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** GraphQL response errors.
- `data` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** GraphQL response data.

#### HttpError

Fetch HTTP error.

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

##### Properties

- `status` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** HTTP status code.
- `statusText` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** HTTP status text.
