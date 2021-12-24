import Cookies from 'js-cookie'

import { COOKIES_DOMAIN } from 'config'

export const getToken = () => Cookies.get('atoken')

export const removeToken = () => {
  Cookies.remove('rtoken', { path: '/', domain: COOKIES_DOMAIN })
  Cookies.remove('atoken', { path: '/', domain: COOKIES_DOMAIN })
}
