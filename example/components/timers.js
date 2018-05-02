import { Query } from 'graphql-react'
import gql from 'fake-tag'
import { timeFetchOptionsOverride } from '../api-fetch-options'
import Loader from './loader'
import FetchError from './fetch-error'
import HTTPError from './http-error'
import ParseError from './parse-error'
import GraphQLErrors from './graphql-errors'

const Timer = ({ id, milliseconds }) => (
  <Query
    fetchOptionsOverride={timeFetchOptionsOverride}
    variables={{ id }}
    query={gql`
      query timer($id: ID!) {
        timer(timerId: $id) {
          id
          milliseconds
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
      <tr>
        <td>{id}</td>
        <td style={{ textAlign: 'right' }}>
          {data ? data.timer.milliseconds : milliseconds}
        </td>
        <td>
          <button disabled={loading} onClick={load}>
            ↻
          </button>
          {(fetchError || httpError || parseError || graphQLErrors) && (
            <strong>Error!</strong>
          )}
        </td>
      </tr>
    )}
  </Query>
)

const Timers = () => (
  <Query
    loadOnMount
    loadOnReset
    fetchOptionsOverride={timeFetchOptionsOverride}
    query={gql`
      {
        timers {
          id
          milliseconds
        }
      }
    `}
  >
    {({ loading, fetchError, httpError, parseError, graphQLErrors, data }) => (
      <section>
        {loading && <Loader />}
        {fetchError && <FetchError error={fetchError} />}
        {httpError && <HTTPError error={httpError} />}
        {parseError && <ParseError error={parseError} />}
        {graphQLErrors && <GraphQLErrors errors={graphQLErrors} />}
        {data &&
          (data.timers.length ? (
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Timer ID</th>
                  <th style={{ textAlign: 'right' }} colSpan="2">
                    Duration (ms)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.timers.map(timer => <Timer key={timer.id} {...timer} />)}
              </tbody>
            </table>
          ) : (
            <p>
              <em>Create a first timer…</em>
            </p>
          ))}
      </section>
    )}
  </Query>
)

export default Timers
