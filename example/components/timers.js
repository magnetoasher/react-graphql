import { GraphQLQuery } from '../../lib'
import Loader from './loader'
import HTTPError from './http-error'
import ParseError from './parse-error'
import GraphQLErrors from './graphql-errors'

const Timer = ({ id, milliseconds }) => (
  <GraphQLQuery
    loadOnMount={false}
    loadOnReset={false}
    variables={{ id }}
    query={`
      query timer($id: ID!) {
        timer(timerId: $id) {
          id
          milliseconds
        }
      }
    `}
  >
    {({ load, loading, httpError, parseError, graphQLErrors, data }) => (
      <tr>
        <td>
          <button disabled={loading} onClick={load}>
            Load
          </button>
          {(httpError || parseError || graphQLErrors) && (
            <strong>Error!</strong>
          )}
        </td>
        <td>{id}</td>
        <td>{data ? data.timer.milliseconds : milliseconds}</td>
      </tr>
    )}
  </GraphQLQuery>
)

const Timers = () => (
  <GraphQLQuery
    query={`
      {
        timers {
          id
          milliseconds
        }
      }
    `}
  >
    {({ loading, httpError, parseError, graphQLErrors, data }) => (
      <section>
        {data &&
          (data.timers.length ? (
            <table>
              <thead>
                <tr>
                  <th>Load</th>
                  <th>Id</th>
                  <th>Milliseconds</th>
                </tr>
              </thead>
              <tbody>
                {data.timers.map(timer => <Timer key={timer.id} {...timer} />)}
              </tbody>
            </table>
          ) : (
            <p>Create a first timer.</p>
          ))}
        {loading && <Loader />}
        {httpError && <HTTPError error={httpError} />}
        {parseError && <ParseError error={parseError} />}
        {graphQLErrors && <GraphQLErrors errors={graphQLErrors} />}
      </section>
    )}
  </GraphQLQuery>
)

export default Timers
