import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';

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
            valueEn
            valueEs
          }
        }
      }
    }
  `;
  return terrasoApi
    .requestGraphQL(query, { types })
    .then(_.get('taxonomyTerms.edges'))
    .then(terms => (_.isEmpty(terms) ? Promise.reject('not_found') : terms))
    .then(extractTerms);
};
