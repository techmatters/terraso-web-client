import Cookies from 'js-cookie'

export const getToken = () => Cookies.get('atoken')

export const removeToken = () => Cookies.remove('atoken', { path: '' })
