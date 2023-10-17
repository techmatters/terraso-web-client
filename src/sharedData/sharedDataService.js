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

import { extractDataEntries, extractDataEntry } from './sharedDataUtils';

import { SHARED_DATA_ACCEPTED_EXTENSIONS } from 'config';

const ALL_RESOURCE_TYPES = [...SHARED_DATA_ACCEPTED_EXTENSIONS, 'link'];

export const uploadSharedDataFile = async ({
  groupSlug,
  landscapeSlug,
  file,
}) => {
  const path = '/shared-data/upload/';

  const body = new FormData();
  const filename = `${file.name}${file.resourceType}`;
  if (groupSlug) {
    body.append('groups', groupSlug);
  }
  if (landscapeSlug) {
    body.append('landscapes', landscapeSlug);
  }
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

export const fetchGroupSharedData = ({
  slug,
  resourceTypes = ALL_RESOURCE_TYPES,
}) => {
  const query = graphql(`
    query group($slug: String!, $resourceTypes: [String]!) {
      groups(slug: $slug) {
        edges {
          node {
            ...dataEntries
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug, resourceTypes })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => extractDataEntries(group));
};

export const addVisualizationConfig = ({
  title,
  group,
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
        configuration,
        dataEntryId: selectedFile.id,
        groupId: group.id,
      },
    })
    .then(response => ({
      slug: _.get('addVisualizationConfig.visualizationConfig.slug', response),
    }));
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

export const fetchVisualizationConfig = ({ groupSlug, configSlug }) => {
  const query = graphql(`
    query fetchVisualizationConfig($groupSlug: String!, $configSlug: String!) {
      visualizationConfigs(
        dataEntry_SharedResources_Target_Slug: $groupSlug
        slug: $configSlug
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
    .requestGraphQL(query, { groupSlug, configSlug })
    .then(_.get('visualizationConfigs.edges[0].node'))
    .then(
      visualizationConfig => visualizationConfig || Promise.reject('not_found')
    )
    .then(visualizationConfig => ({
      ...visualizationConfig,
      configuration: JSON.parse(visualizationConfig.configuration),
    }));
};
