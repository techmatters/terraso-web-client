import _ from 'lodash'

// TODO Move this to the correct configuration file when the deployment process is defined
const TERRASO_API_URL = 'http://localhost:8000/graphql/'

const handleGraphQLError = jsonResponse => jsonResponse
  .then(data => {
    if (!_.has(data, 'errors')) {
      return Promise.reject('common.error_unexpected')
    }

    const errors = _.get(data, 'errors')
    const message = _.chain(errors)
      .map(error => error.message)
      .join('. ')
      .value()
    return Promise.reject(message)
  })

export const request = (query, variables) => fetch(TERRASO_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query, variables })
})
  .then(response => response.ok
    ? response.json()
    : handleGraphQLError(response.json()) // Non 2xx errors
  )
  .then(response => _.has(response, 'errors')
    ? handleGraphQLError(Promise.resolve(response)) // GraphQL errors inside a 2xx response
    : response.data
  )
