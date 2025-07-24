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

import { TILESET_STATUS_READY } from 'sharedData/sharedDataConstants';
import {
  extractDataEntry,
  extractSharedResource,
} from 'sharedData/sharedDataUtils';

import { SHARED_DATA_ACCEPTED_EXTENSIONS } from 'config';

const ALL_RESOURCE_TYPES = [...SHARED_DATA_ACCEPTED_EXTENSIONS, 'link'];

export const uploadSharedDataFile = async ({
  targetType,
  targetSlug,
  file,
}) => {
  const path = '/shared-data/upload/';

  const body = new FormData();
  const filename = `${file.name}${file.resourceType}`;
  body.append('target_type', targetType);
  body.append('target_slug', targetSlug);
  body.append('name', file.name);
  if (file.description) {
    body.append('description', file.description);
  }
  body.append('data_file', file.file, filename);

  const jsonResponse = await terrasoApi.request({ path, body });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};

export const deleteSharedData = ({ dataEntry }) => {
  const query = graphql(`
    mutation deleteSharedData($id: ID!) {
      deleteDataEntry(input: { id: $id }) {
        dataEntry {
          id
        }
        errors
      }
    }
  `);
  return terrasoApi.requestGraphQL(query, {
    id: dataEntry.id,
  });
};

export const addSharedDataLink = ({ targetType, targetSlug, link }) => {
  const query = graphql(`
    mutation addDataEntry($input: DataEntryAddMutationInput!) {
      addDataEntry(input: $input) {
        dataEntry {
          id
          name
          url
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        ..._.pick(['name', 'url', 'description'], link),
        entryType: 'link',
        resourceType: 'link',
        targetType,
        targetSlug,
      },
    })
    .then(_.get('addDataEntry.dataEntry'));
};

export const updateSharedData = ({ dataEntry }) => {
  const query = graphql(`
    mutation updateSharedData($input: DataEntryUpdateMutationInput!) {
      updateDataEntry(input: $input) {
        dataEntry {
          ...dataEntry
          visualizations {
            edges {
              node {
                ...visualizationConfigWithConfiguration
              }
            }
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: dataEntry,
    })
    .then(_.get('updateDataEntry.dataEntry'))
    .then(extractDataEntry);
};

export const fetchDataEntries = ({
  targetSlug,
  targetType,
  resourceTypes = ALL_RESOURCE_TYPES,
}) => {
  const query = graphql(`
    query dataEntries(
      $slug: String!
      $type: String!
      $resourceTypes: [String]!
    ) {
      dataEntries(
        sharedResources_Target_Slug: $slug
        sharedResources_TargetContentType: $type
        resourceType_In: $resourceTypes
      ) {
        edges {
          node {
            ...dataEntry
            ...dataEntryVisualizations
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      slug: targetSlug,
      type: targetType,
      resourceTypes,
    })
    .then(_.get('dataEntries.edges'))
    .then(edges => edges.map(edge => extractDataEntry(edge.node)));
};

export const fetchAllDataEntries = ({ resourceTypes = ALL_RESOURCE_TYPES }) => {
  const query = graphql(`
    query allDataEntries($resourceTypes: [String]!) {
      dataEntries(resourceType_In: $resourceTypes) {
        edges {
          node {
            ...dataEntry
            ...dataEntryVisualizations
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      resourceTypes,
    })
    .then(_.get('dataEntries.edges'))
    .then(edges => edges.map(edge => extractDataEntry(edge.node)));
};

export const fetchDataEntriesWithGeojson = ({ id }) => {
  const query = graphql(`
    query dataEntryWithGeojson($id: ID!) {
      dataEntry(id: $id) {
        ...dataEntry
        geojson
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { id })
    .then(_.get('dataEntry'))
    .then(dataEntry => dataEntry || Promise.reject('not_found'))
    .then(extractDataEntry);
};

export const addVisualizationConfig = ({
  title,
  description,
  ownerId,
  ownerType,
  selectedFile,
  visualizationConfig,
}) => {
  const query = graphql(`
    mutation addVisualizationConfig(
      $input: VisualizationConfigAddMutationInput!
    ) {
      addVisualizationConfig(input: $input) {
        visualizationConfig {
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
    .then(_.get('addVisualizationConfig.visualizationConfig'));
};

export const deleteVisualizationConfig = config => {
  const query = graphql(`
    mutation deleteVisualizationConfig($id: ID!) {
      deleteVisualizationConfig(input: { id: $id }) {
        visualizationConfig {
          ...visualizationConfig
        }
        errors
      }
    }
  `);
  return terrasoApi.requestGraphQL(query, {
    id: config.id,
  });
};

export const fetchVisualizationConfig = ({
  ownerSlug,
  ownerType,
  configSlug,
  readableId,
}) => {
  const query = graphql(`
    query fetchVisualizationConfig(
      $ownerSlug: String!
      $ownerType: String!
      $configSlug: String!
      $readableId: String!
    ) {
      visualizationConfigs(
        dataEntry_SharedResources_Target_Slug: $ownerSlug
        dataEntry_SharedResources_TargetContentType: $ownerType
        slug: $configSlug
        readableId: $readableId
      ) {
        edges {
          node {
            ...visualizationConfigWithConfiguration
            dataEntry {
              ...dataEntry
            }
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { ownerSlug, ownerType, configSlug, readableId })
    .then(_.get('visualizationConfigs.edges[0].node'))
    .then(
      visualizationConfig => visualizationConfig || Promise.reject('not_found')
    )
    .then(visualizationConfig => ({
      ...visualizationConfig,
      mapboxTilesetId:
        visualizationConfig.mapboxTilesetStatus === TILESET_STATUS_READY
          ? visualizationConfig.mapboxTilesetId
          : null,
      configuration: JSON.parse(visualizationConfig.configuration),
    }));
};

export const updateSharedResource = ({ sharedResource }) => {
  const query = graphql(`
    mutation updateSharedResource($input: SharedResourceUpdateMutationInput!) {
      updateSharedResource(input: $input) {
        sharedResource {
          id
          shareAccess
          shareUrl
          source {
            ... on DataEntryNode {
              ...dataEntry
              ...dataEntryVisualizations
            }
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: _.pick(['id', 'shareAccess'], sharedResource),
    })
    .then(_.get('updateSharedResource.sharedResource'))
    .then(extractSharedResource);
};

export const fetchSharedResource = ({ shareUuid }) => {
  const query = graphql(`
    query sharedResource($shareUuid: String!) {
      sharedResource(shareUuid: $shareUuid) {
        downloadUrl
        source {
          ... on DataEntryNode {
            ...dataEntry
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      shareUuid,
    })
    .then(_.get('sharedResource'))
    .then(sharedResource => sharedResource || Promise.reject('not_found'))
    .then(extractSharedResource);
};
