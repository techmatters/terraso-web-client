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

import _ from 'lodash/fp';

import { ALL_TYPES } from 'terraso-web-client/taxonomies/taxonomiesConstants';

const LOCALE_MAPPING = {
  'en-US': 'valueEn',
  'es-ES': 'valueEs',
};

export const extractTerms = terms =>
  _.flow(
    _.map(edge => {
      const term = _.get('node', edge);
      return { ...term, type: ALL_TYPES[term.type] };
    }),
    _.groupBy(term => term.type)
  )(terms);

export const getTermLabel = (option, language) => {
  const valueKey = LOCALE_MAPPING[language];
  return option[valueKey] || option['valueOriginal'] || '';
};
