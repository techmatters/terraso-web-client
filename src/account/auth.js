import Cookies from 'js-cookie'
import jwt from 'jwt-decode'

import { COOKIES_DOMAIN, TERRASO_API_URL } from 'config'
import { UNAUTHENTICATED } from 'account/authConstants'

const COOKIES_PARAMS = { path: '/', domain: COOKIES_DOMAIN }

export const getToken = () => Cookies.get('atoken')

export const removeToken = () => {
  Cookies.remove('rtoken', COOKIES_PARAMS)
  Cookies.remove('atoken', COOKIES_PARAMS)
}

export const refreshToken = async () => {
  const response = await fetch(
    new URL('/auth/tokens', TERRASO_API_URL).href,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: Cookies.get('rtoken') })
    }
  )

  if (response.status !== 200) {
    await Promise.reject(UNAUTHENTICATED)
  }

  const tokens = await response.json()

  const { access_token: atoken, refresh_token: rtoken } = tokens

  Cookies.set('rtoken', rtoken, COOKIES_PARAMS)
  Cookies.set('atoken', atoken, COOKIES_PARAMS)
}

export const getUserEmail = () => jwt(Cookies.get('atoken')).email
