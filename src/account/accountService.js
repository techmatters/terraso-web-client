import path from 'path'

import { TERRASO_API_URL } from 'config'

const getURL = provider => fetch(
  path.join(TERRASO_API_URL, 'auth', provider, 'authorize'),
  {
    headers: { 'Content-Type': 'application/json'
    }
  }
)
  .then(response => response.json())
  .then(response => response['request_url'])

export const getAuthURLs = () => Promise.all([
  getURL('google'),
  getURL('apple')
])
  .then(([google, apple]) => ({ google, apple }))
