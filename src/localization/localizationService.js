import _ from 'lodash'

const values = {
  'en-US': require('./locales/en-US.json')
}

export const getLocaleValues = userLocale => {
  const localeMessages = _.get(values, userLocale)
  if (localeMessages) {
    return localeMessages
  }
  const fallbackLocale = _.chain(values)
    .toPairs()
    .map(([locale]) => locale)
    .find(locale => locale.startsWith(_.split(userLocale, '-', 1)))
    .value()

  if (!fallbackLocale) {
    // Default locale
    console.warn(`User locale (${userLocale}) not found, using deafult locale (en-US)`)
    return _.get(values, 'en-US')
  }
  console.warn(`User locale (${userLocale}) not found, using fallback locale (${fallbackLocale})`)
  return _.get(values, fallbackLocale)
}
