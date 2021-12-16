import _ from 'lodash'

// TODO Move this to the correct configuration file when the deployment process is defined
const TERRASO_API_URL = 'http://localhost:8000/graphql/'

const handleGraphQLError = data => {
  const errors = _.get(data, 'errors')
  const messages = errors.map(error => error.message)
  return Promise.reject(messages)
}

export const request = async (query, variables) => {
  const response = await fetch(TERRASO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })
    .catch(error => {
      console.error('Terraso API: Failed to execute request', error)
      return Promise.reject(['terraso_api.error_request_response'])
    })

  const jsonResponse = await response.json()
    .catch(error => {
      console.error('Terraso API: Failed to parse response', error)
      return Promise.reject(['terraso_api.error_request_response'])
    })

  if (_.has(jsonResponse, 'errors')) {
    await handleGraphQLError(jsonResponse)
  }

  if (!_.has(jsonResponse, 'data')) {
    console.error('Terraso API: Unexpected error', 'received data:', jsonResponse)
    await Promise.reject(['terraso_api.error_unexpected'])
  }

  return jsonResponse.data
}
