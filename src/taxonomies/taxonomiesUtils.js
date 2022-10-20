import _ from 'lodash/fp';

import { ALL_TYPES } from './taxonomiesConstants';

export const extractTerms = terms =>
  _.flow(
    _.map(edge => {
      const term = _.get('node', edge);
      return { ...term, type: ALL_TYPES[term.type] };
    }),
    _.groupBy(term => term.type)
  )(terms);

export const getTermLabel = (option, language) => {
  const languageKey = language.startsWith('en') ? 'valueEn' : 'valueEs';
  const valueKey = option[languageKey]
    ? languageKey
    : _.head(Object.keys(option).filter(key => key.startsWith('value')));
  return option[valueKey] || '';
};
