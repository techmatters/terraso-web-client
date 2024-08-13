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
import { graphql } from 'terrasoApi/shared/graphqlSchema';

import { extractGroup } from 'group/groupUtils';
import { extractLandscape } from 'landscape/landscapeUtils';
import { extractStoryMap } from 'storyMap/storyMapUtils';

export const fetchHomeData = email => {
  const query = graphql(`
    query home($accountEmail: String!) {
      landscapes(membershipList_Memberships_User_Email: $accountEmail) {
        edges {
          node {
            ...landscapeFields
            ...landscapeMembershipList
          }
        }
      }
      userIndependentGroups: groups(
        memberships_Email: $accountEmail
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
            membershipList {
              ...collaborationMembershipsPending
              ...accountCollaborationMembership
            }
          }
        }
      }
      userLandscapeGroups: groups(
        memberships_Email: $accountEmail
        associatedLandscapes_Isnull: false
      ) {
        edges {
          node {
            ...groupFields
            membershipList {
              ...collaborationMembershipsPending
              ...accountCollaborationMembership
            }
          }
        }
      }
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
    .then(async response => ({
      groups: [
        ..._.getOr([], 'userIndependentGroups.edges', response),
        ..._.getOr([], 'userLandscapeGroups.edges', response),
      ]
        .map(_.get('node'))
        .filter(group => group)
        .map(extractGroup),
      landscapes: await Promise.all(
        _.getOr([], 'landscapes.edges', response)
          .map(_.get('node'))
          .filter(landscape => landscape)
          .map(landscape => extractLandscape(landscape, false))
      ),
      storyMaps: _.getOr([], 'storyMaps.edges', response)
        .map(_.get('node'))
        .sort(_.get('publishedAt'))
        .reverse()
        .map(extractStoryMap),
    }));
};
