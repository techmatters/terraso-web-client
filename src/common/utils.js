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

export const countryNameForCode = code => {
  const list = countriesList();
  return list.find(country => country.code === code);
};

// from https://stackoverflow.com/a/44325124; allow comma operator for speed
export const countryMap = countries =>
  countries.reduce((obj, item) => ((obj[item.code] = item.name), obj), {}); // eslint-disable-line no-sequences
