/*
 * Copyright © 2023 Technology Matters
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
  countries.reduce((obj, item) => {
    obj[item.code] = item.name;
    return obj;
  }, {});
