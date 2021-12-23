import Cookies from 'js-cookie'

export const getToken = () => Cookies.get('atoken')

export const removeToken = () => {
  const domain = window.location.hostname
  console.log({ domain })
  Cookies.remove('atoken', { path: '/', domain })
}
