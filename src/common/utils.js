import i18n from 'i18next';
import _ from 'lodash/fp';
import countries from 'world-countries';

export const transformURL = url => {
  if (url === '' || url.startsWith('http:') || url.startsWith('https:')) {
    return url;
  }

  return `https://${url}`;
};

export const countriesList = () => {
  const countriesLang = i18n.resolvedLanguage.startsWith('es')
    ? 'translations.spa.common'
    : 'name.common';

  const countriesList = _.flow(
    _.map(item => ({ code: item.cca2, name: _.get(countriesLang, item) })),
    _.sortBy('name')
  )(countries);

  return countriesList;
};
