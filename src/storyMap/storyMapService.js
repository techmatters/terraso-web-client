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

import i18n from 'i18next';
import _ from 'lodash/fp';
import {
  extractAccountMembership,
  extractMembership,
  extractMemberships,
} from 'terraso-client-shared/collaboration/membershipsUtils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { StoryMapMetadataFieldsFragmentDoc } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { graphql } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/index';

import { TILESET_STATUS_PENDING } from 'terraso-web-client/sharedData/sharedDataConstants';
import {
  compareStoryMapsByUpdatedAt,
  extractStoryMap,
  getStoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapUtils';

const normalizeUpdatedStoryMap = (storyMap, response = {}) => ({
  ...response,
  storyMapId: response.storyMapId || response.story_map_id,
  publishedAt: response.publishedAt || response.published_at,
  configuration: response.configuration || storyMap.config,
  config: getStoryMapConfig({
    ...response,
    config: response.config || storyMap.config,
    configuration: response.configuration || storyMap.config,
  }),
  isPublished:
    response.isPublished ||
    Boolean(response.publishedAt || response.published_at || storyMap.publish),
});

export const fetchUserStoryMaps = (params, currentUser) => {
  return terrasoApi
    .requestGraphQL(
      `
        query userStoryMapsHome($accountEmail: String!) {
          userStoryMaps: storyMaps(memberships_User_Email: $accountEmail) {
            edges {
              node {
                ...storyMapMetadataFields
              }
            }
          }
        }
        ${StoryMapMetadataFieldsFragmentDoc}
      `,
      { accountEmail: currentUser.email }
    )
    .then(response => ({
      userStoryMaps: _.getOr([], 'userStoryMaps.edges', response)
        .map(_.get('node'))
        .map(extractStoryMap)
        .sort(compareStoryMapsByUpdatedAt),
    }));
};

export const fetchStoryMap = ({ slug, storyMapId }) => {
  const query = graphql(`
    query fetchStoryMap($slug: String, $storyMapId: String!) {
      storyMaps(slug: $slug, storyMapId: $storyMapId) {
        edges {
          node {
            ...storyMapPublishedFields
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
      config: storyMap.publishedConfiguration
        ? JSON.parse(storyMap.publishedConfiguration)
        : JSON.parse(storyMap.configuration),
      memberships: extractMemberships(storyMap.membershipList),
      accountMembership: extractAccountMembership(storyMap.membershipList),
    }));
};

export const fetchStoryMapForm = ({ slug, storyMapId }) => {
  const query = graphql(`
    query fetchStoryMapForm($slug: String, $storyMapId: String!) {
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

const generateValidTitle = inputTitle =>
  _.isEmpty(inputTitle) ? i18n.t('storyMap.form_untitled') : inputTitle.trim();

export const addStoryMap = async ({ storyMap, files }) => {
  const path = '/story-map/add/';

  const storyMapForm = new FormData();
  const title = _.get('config.title', storyMap);
  storyMapForm.append('title', generateValidTitle(title));
  storyMapForm.append('publish', storyMap.publish);
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
  storyMapForm.append(
    'title',
    generateValidTitle(_.getOr('', 'config.title', storyMap))
  );
  storyMapForm.append('publish', storyMap.publish);
  storyMapForm.append('configuration', JSON.stringify(storyMap.config));
  Object.keys(files).forEach((fileId, index) => {
    const file = files[fileId].file;
    storyMapForm.append('files', file, fileId);
  });

  const jsonResponse = await terrasoApi.request({ path, body: storyMapForm });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return normalizeUpdatedStoryMap(storyMap, jsonResponse);
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

export const addMapLayer = ({
  title,
  description,
  ownerId,
  ownerType,
  selectedFile,
  visualizationConfig,
}) => {
  const query = graphql(`
    mutation addMapLayer($input: VisualizationConfigAddMutationInput!) {
      addVisualizationConfig(input: $input) {
        visualizationConfig {
          ...visualizationConfigWithConfiguration
          geojson
          dataEntry {
            name
            resourceType
            createdBy {
              lastName
              firstName
            }
            sharedResources {
              edges {
                node {
                  target {
                    ... on GroupNode {
                      name
                      membershipList {
                        membershipType
                      }
                    }
                    ... on LandscapeNode {
                      name
                    }
                  }
                }
              }
            }
          }
          slug
          readableId
        }
        errors
      }
    }
  `);
  const configuration = JSON.stringify(
    _.omit('selectedFile', visualizationConfig)
  );
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        title,
        description,
        configuration,
        dataEntryId: selectedFile.id,
        ownerId,
        ownerType,
      },
    })
    .then(_.get('addVisualizationConfig.visualizationConfig'))
    .then(({ geojson, configuration, ...rest }) => {
      const result = {
        ...rest,
        ...JSON.parse(configuration),
        // The created layer is owned by the story map being edited.
        ownerType: 'StoryMapNode',
      };
      // Only include inline geojson for VCs without S3 URL (legacy path)
      if (!rest.geojsonSignedUrl) {
        result.geojson = JSON.parse(geojson);
      }
      return result;
    });
};

export const fetchDataLayers = ({ ownerId, email }) => {
  const query = graphql(`
    query visualizationConfigs($ownerId: UUID!, $email: String!) {
      storyMapConfigs: visualizationConfigs(ownerObjectId: $ownerId) {
        edges {
          node {
            ...visualizationConfigWithStoryMapContext
          }
        }
      }
      # The backend scopes visualizationConfigs to the current user's
      # APPROVED memberships (get_queryset in backend
      # visualization_config.py), so the tabs only ever list layers from the
      # user's own groups/landscapes. The myGroups/myLandscapes aliases exist
      # anyway to drive TAB VISIBILITY (member vs not), not layer filtering:
      # an empty groupConfigs list cannot distinguish "member with no maps"
      # from "not a member", and the per-tab empty-state copy depends on that
      # distinction. The inner membershipStatus: APPROVED filter keeps tab
      # visibility aligned with the backend's APPROVED-only scoping (the root
      # memberships_Email filter matches pending memberships too).
      landscapeConfigs: visualizationConfigs(
        dataEntry_SharedResources_TargetContentType: "landscape"
      ) {
        edges {
          node {
            ...visualizationConfigWithStoryMapContext
          }
        }
      }
      groupConfigs: visualizationConfigs(
        dataEntry_SharedResources_TargetContentType: "group"
      ) {
        edges {
          node {
            ...visualizationConfigWithStoryMapContext
          }
        }
      }
      myGroups: groups(memberships_Email: $email) {
        edges {
          node {
            membershipList {
              memberships(user_Email_In: [$email], membershipStatus: APPROVED) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
      myLandscapes: landscapes(membershipList_Memberships_User_Email: $email) {
        edges {
          node {
            membershipList {
              memberships(user_Email_In: [$email], membershipStatus: APPROVED) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  `);
  return terrasoApi.requestGraphQL(query, { ownerId, email }).then(lists => ({
    list: [
      ...(lists.storyMapConfigs?.edges || []),
      ...(lists.landscapeConfigs?.edges || []),
      ...(lists.groupConfigs?.edges || []),
    ].map(entry => ({
      ..._.omit(['configuration', 'geojson', 'owner'], entry.node),
      tilesetId: entry.node.mapboxTilesetId,
      geojsonSignedUrl: entry.node.geojsonSignedUrl,
      processing:
        !entry.node.geojsonSignedUrl &&
        (entry.node.mapboxTilesetStatus === TILESET_STATUS_PENDING ||
          !entry.node.mapboxTilesetId),
      ownerType: entry.node.owner?.__typename,
      ...JSON.parse(entry.node.configuration),
      geojson: JSON.parse(entry.node.geojson),
    })),
    hasGroups: lists.myGroups?.edges?.some(
      edge => edge.node?.membershipList?.memberships?.edges?.length > 0
    ),
    hasLandscapes: lists.myLandscapes?.edges?.some(
      edge => edge.node?.membershipList?.memberships?.edges?.length > 0
    ),
  }));
};
