import Cookies from 'js-cookie'

const COOKIES_DOMAIN = '.terraso.org'

export const getToken = () => Cookies.get('atoken')

export const removeToken = () => {
  Cookies.remove('rtoken', { path: '/', domain: COOKIES_DOMAIN })
  Cookies.remove('atoken', { path: '/', domain: COOKIES_DOMAIN })
}
