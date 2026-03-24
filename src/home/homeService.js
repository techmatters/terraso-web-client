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
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { graphql } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/index';

import { extractStoryMap } from 'terraso-web-client/storyMap/storyMapUtils';

export const fetchHomeStoryMaps = email => {
  const query = graphql(`
    query homeStoryMaps($accountEmail: String!) {
      storyMaps(memberships_User_Email: $accountEmail) {
        edges {
          node {
            ...storyMapMetadataFields
          }
        }
      }
    }
  `);

  return terrasoApi
    .requestGraphQL(query, { accountEmail: email })
    .then(response =>
      _.getOr([], 'storyMaps.edges', response)
        .map(_.get('node'))
        .sort(_.get('publishedAt'))
        .reverse()
        .map(extractStoryMap)
    );
};
