import Cookies from 'js-cookie'
import jwt from 'jwt-decode'

import { COOKIES_DOMAIN } from 'config'

export const getToken = () => Cookies.get('atoken')

export const removeToken = () => {
  Cookies.remove('rtoken', { path: '/', domain: COOKIES_DOMAIN })
  Cookies.remove('atoken', { path: '/', domain: COOKIES_DOMAIN })
}

export const getUserEmail = () => jwt(Cookies.get('atoken')).email
