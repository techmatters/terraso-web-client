import { getToken } from 'account/auth'
import { TERRASO_API_URL } from 'config'
import { UNAUTHENTICATED } from 'account/authConstants'

const getURL = provider => fetch(
  new URL(`/auth/${provider}/authorize`, TERRASO_API_URL).href,
  { headers: { 'Content-Type': 'application/json' } }
)
  .then(response => response.json())
  .then(response => response.request_url)

export const getAuthURLs = () => Promise.all([
  getURL('google'),
  getURL('apple')
])
  .then(([google, apple]) => ({ google, apple }))

export const fetchUser = () => fetch(
  new URL('/auth/user', TERRASO_API_URL).href,
  {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  }
)
  .then(response => {
    if (response.status === 401) {
      return Promise.reject(UNAUTHENTICATED)
    }
    return response
  })
  .then(response => response.json())
