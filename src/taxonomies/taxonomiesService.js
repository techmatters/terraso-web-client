import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';

import { taxonomyTermLanguages } from './taxonomiesFragments';
import { extractTerms } from './taxonomiesUtils';

export const fetchTermsForTypes = ({ types }) => {
  const query = `
    query taxonomyTerms($types: [String]!){
      taxonomyTerms(type_In: $types) {
        edges {
          node {
            slug
            type
            valueOriginal
            ...taxonomyTermLanguages
          }
        }
      }
    }
    ${taxonomyTermLanguages}
  `;
  return terrasoApi
    .requestGraphQL(query, { types })
    .then(_.get('taxonomyTerms.edges'))
    .then(terms => (_.isEmpty(terms) ? [] : terms))
    .then(extractTerms);
};
