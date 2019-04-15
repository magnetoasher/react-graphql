import PropTypes from 'prop-types'
import React from 'react'
import { FirstRenderDateContext } from './FirstRenderDateContext'
import { GraphQL } from './GraphQL'
import { GraphQLContext } from './GraphQLContext'

/**
 * A React component to provide a [`GraphQL`]{@link GraphQL} instance to an app.
 * @kind function
 * @name GraphQLProvider
 * @param {Object} props Component props.
 * @prop {GraphQL} props.graphql [`GraphQL`]{@link GraphQL} instance.
 * @prop {ReactNode} [props.children] React children.
 * @returns {ReactNode} React virtual DOM node.
 * @see [`GraphQLContext`]{@link GraphQLContext} is provided via this component.
 * @see [`useGraphQL`]{@link useGraphQL} React hook requires this component to be an ancestor to work.
 * @example <caption>Provide a [`GraphQL`]{@link GraphQL} instance for an app.</caption>
 * ```jsx
 * import { GraphQL, GraphQLProvider } from 'graphql-react'
 *
 * const graphql = new GraphQL()
 *
 * const App = ({ children }) => (
 *   <GraphQLProvider graphql={graphql}>{children}</GraphQLProvider>
 * )
 * ```
 */
export const GraphQLProvider = ({ graphql, children }) => {
  const firstRenderDateRef = React.useRef(new Date())

  return (
    <FirstRenderDateContext.Provider value={firstRenderDateRef.current}>
      <GraphQLContext.Provider value={graphql}>
        {children}
      </GraphQLContext.Provider>
    </FirstRenderDateContext.Provider>
  )
}

GraphQLProvider.propTypes = {
  graphql: PropTypes.instanceOf(GraphQL).isRequired,
  children: PropTypes.node
}
