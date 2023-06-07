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
import { graphql } from 'terrasoApi/shared/graphqlSchema';
import * as terrasoApi from 'terrasoApi/shared/terrasoApi/api';
import { extractTerms } from './taxonomiesUtils';

export const fetchTermsForTypes = ({ types }) => {
  const query = graphql(`
    query taxonomyTerms($types: [CoreTaxonomyTermTypeChoices]!) {
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
  `);
  return terrasoApi
    .requestGraphQL(query, { types })
    .then(_.get('taxonomyTerms.edges'))
    .then(terms => (_.isEmpty(terms) ? [] : terms))
    .then(extractTerms);
};
