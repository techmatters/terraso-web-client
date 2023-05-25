/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import i18n from 'i18next';
import _ from 'lodash/fp';
import countries from 'world-countries';
import * as yup from 'yup';

export const getAcronym = name => name.match(/\b(\w)/g).join('');

export const transformURL = url => {
  if (url === '' || url.startsWith('http:') || url.startsWith('https:')) {
    return url;
  }

  return `https://${url}`;
};

export const URL_SCHEMA = yup.object({
  url: yup
    .string()
    .trim()
    .ensure()
    .transform(transformURL)
    .validTld()
    .url()
    .required(),
});

export const isUrl = url => {
  try {
    URL_SCHEMA.validateSync({ url });
    return true;
  } catch (err) {
    return false;
  }
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
