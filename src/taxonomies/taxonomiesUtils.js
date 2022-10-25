import _ from 'lodash/fp';

import { ALL_TYPES } from './taxonomiesConstants';

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
  const valueKey = LOCALE_MAPPING[language] || 'valueOriginal';
  return option[valueKey] || '';
};
