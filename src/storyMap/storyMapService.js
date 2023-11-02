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
import _ from 'lodash/fp.js';
import {
  extractAccountMembership,
  extractMembership,
  extractMemberships,
} from 'terraso-client-shared/collaboration/membershipsUtils.js';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api.js';
import { graphql } from 'terrasoApi/shared/graphqlSchema/index.ts';

import { extractStoryMap } from './storyMapUtils.js';

export const fetchSamples = (params, currentUser) => {
  const query = graphql(`
    query storyMapsHome($accountEmail: String!) {
      samples: storyMaps(memberships_User_Email_Not: $accountEmail) {
        edges {
          node {
            ...storyMapMetadataFields
          }
        }
      }
      userStoryMaps: storyMaps(memberships_User_Email: $accountEmail) {
        edges {
          node {
            ...storyMapMetadataFields
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { accountEmail: currentUser.email })
    .then(response => ({
      samples: _.getOr([], 'samples.edges', response)
        .map(_.get('node'))
        .sort(_.get('publishedAt'))
        .reverse()
        .map(extractStoryMap),
      userStoryMaps: _.getOr([], 'userStoryMaps.edges', response)
        .map(_.get('node'))
        .sort(_.get('publishedAt'))
        .reverse()
        .map(extractStoryMap),
    }));
};

export const fetchStoryMap = ({ slug, storyMapId }) => {
  const query = graphql(`
    query fetchStoryMap($slug: String!, $storyMapId: String!) {
      storyMaps(slug: $slug, storyMapId: $storyMapId) {
        edges {
          node {
            ...storyMapFields
            membershipList {
              ...collaborationMemberships
              ...accountCollaborationMembership
            }
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug, storyMapId })
    .then(_.get('storyMaps.edges[0].node'))
    .then(storyMap => storyMap || Promise.reject('not_found'))
    .then(storyMap => ({
      ..._.omit(['membershipList', 'configuration'], storyMap),
      config: JSON.parse(storyMap.configuration),
      memberships: extractMemberships(storyMap.membershipList),
      accountMembership: extractAccountMembership(storyMap.membershipList),
    }));
};

export const addStoryMap = async ({ storyMap, files }) => {
  const path = '/story-map/add/';

  const storyMapForm = new FormData();
  storyMapForm.append('title', _.getOr('', 'config.title', storyMap).trim());
  storyMapForm.append('is_published', storyMap.published);
  storyMapForm.append('configuration', JSON.stringify(storyMap.config));
  Object.keys(files).forEach((fileId, index) => {
    const file = files[fileId].file;
    storyMapForm.append('files', file, fileId);
  });

  const jsonResponse = await terrasoApi.request({ path, body: storyMapForm });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};
export const updateStoryMap = async ({ storyMap, files }) => {
  const path = '/story-map/update/';

  const storyMapForm = new FormData();
  storyMapForm.append('id', storyMap.id);
  storyMapForm.append('title', _.getOr('', 'config.title', storyMap).trim());
  storyMapForm.append('is_published', storyMap.published);
  storyMapForm.append('configuration', JSON.stringify(storyMap.config));
  Object.keys(files).forEach((fileId, index) => {
    const file = files[fileId].file;
    storyMapForm.append('files', file, fileId);
  });

  const jsonResponse = await terrasoApi.request({ path, body: storyMapForm });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};

export const deleteStoryMap = ({ storyMap }) => {
  const query = graphql(`
    mutation deleteStoryMap($id: ID!) {
      deleteStoryMap(input: { id: $id }) {
        storyMap {
          id
        }
        errors
      }
    }
  `);
  return terrasoApi.requestGraphQL(query, {
    id: storyMap.id,
  });
};

export const addMemberships = ({ storyMap, emails, userRole }) => {
  const query = graphql(`
    mutation addMemberships($input: StoryMapMembershipSaveMutationInput!) {
      saveStoryMapMembership(input: $input) {
        memberships {
          ...collaborationMembershipFields
        }
        errors
      }
    }
  `);

  return terrasoApi
    .requestGraphQL(query, {
      input: {
        storyMapId: storyMap.storyMapId,
        storyMapSlug: storyMap.slug,
        userEmails: emails,
        userRole,
      },
    })
    .then(_.get('saveStoryMapMembership.memberships'))
    .then(response =>
      response.map(membership => extractMembership(membership))
    );
};

export const deleteMembership = ({ storyMap, membership }) => {
  const query = graphql(`
    mutation deleteMembership($input: StoryMapMembershipDeleteMutationInput!) {
      deleteStoryMapMembership(input: $input) {
        membership {
          id
        }
        errors
      }
    }
  `);

  return terrasoApi
    .requestGraphQL(query, {
      input: {
        id: membership.membershipId,
        storyMapId: storyMap.storyMapId,
        storyMapSlug: storyMap.slug,
      },
    })
    .then(_.get('deleteStoryMapMembership.membership'));
};

export const approveMembership = ({ membership }, currentUser) => {
  const query = graphql(`
    mutation approveMembership(
      $accountEmail: String!
      $input: StoryMapMembershipApproveMutationInput!
    ) {
      approveStoryMapMembership(input: $input) {
        membership {
          id
        }
        storyMap {
          ...storyMapMetadataFields
        }
        errors
      }
    }
  `);

  return terrasoApi
    .requestGraphQL(query, {
      input: {
        membershipId: membership.membershipId,
      },
      accountEmail: currentUser.email,
    })
    .then(response => ({
      membership: response.approveStoryMapMembership.membership,
      storyMap: extractStoryMap(response.approveStoryMapMembership.storyMap),
    }));
};

export const approveMembershipToken = ({ membership, token, accountEmail }) => {
  const query = graphql(`
    mutation approveMembershipToken(
      $accountEmail: String!
      $input: StoryMapMembershipApproveTokenMutationInput!
    ) {
      approveStoryMapMembershipToken(input: $input) {
        membership {
          id
        }
        storyMap {
          ...storyMapMetadataFields
        }
        errors
      }
    }
  `);

  return terrasoApi
    .requestGraphQL(query, {
      input: {
        inviteToken: token,
      },
      accountEmail,
    })
    .then(response => response.approveStoryMapMembershipToken)
    .then(response => ({
      membership: response.membership,
      storyMap: extractStoryMap(response.storyMap),
    }));
};
