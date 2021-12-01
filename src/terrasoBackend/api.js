import _ from 'lodash'

// TODO configuration backend
const URL = 'http://localhost:8000/graphql/'

const handleGraphQLError = response => response.json()
  .then(data => {
    const errors = _.get(data, 'errors')
    if (!_.has(data, 'errors')) {
      return Promise.reject('common.error_unexpected')
    }

    const message = _.chain(errors)
      .map(error => error.message)
      .join('. ')
      .value()
    return Promise.reject(message)
  })

export const request = (query, variables) => fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query, variables })
})
  .then(response => response.ok
    ? response.json()
    : handleGraphQLError(response)
  )
  .then(response => {
    return response.data
  })
