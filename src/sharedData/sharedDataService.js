import _ from 'lodash/fp';

import { dataEntries } from 'group/groupFragments';
import { extractDataEntries } from 'group/groupUtils';
import * as terrasoApi from 'terrasoBackend/api';

import { SHARED_DATA_ACCEPTED_EXTENSIONS } from 'config';

import {
  dataEntry,
  visualizationConfig,
  visualizationConfigWithConfiguration,
} from './sharedDataFragments';

export const uploadSharedDataFile = async ({ groupSlug, file }) => {
  const path = '/shared-data/upload/';

  const body = new FormData();
  const filename = `${file.name}${file.resourceType}`;
  body.append('groups', groupSlug);
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

export const deleteSharedData = ({ file }) => {
  const query = `
    mutation deleteSharedData($id: ID!) {
      deleteDataEntry(input: { id: $id }) {
        dataEntry {
          id
        }
      }
    }
  `;
  return terrasoApi.requestGraphQL(query, {
    id: file.id,
  });
};

export const updateSharedData = ({ file }) => {
  const query = `
    mutation updateSharedData($input: DataEntryUpdateMutationInput!) {
      updateDataEntry(input: $input) {
        dataEntry {
          id
        }
      }
    }
  `;
  return terrasoApi.requestGraphQL(query, {
    input: file,
  });
};

export const fetchGroupSharedData = ({
  slug,
  resourceTypes = SHARED_DATA_ACCEPTED_EXTENSIONS,
}) => {
  const query = `
    query group($slug: String!, $resourceTypes: [String]!){
      groups(slug: $slug) {
        edges {
          node {
            ...dataEntries
          }
        }
      }
    }
    ${dataEntries}
  `;
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
  const query = `
    mutation addVisualizationConfig($input: VisualizationConfigAddMutationInput!) {
      addVisualizationConfig(input: $input) {
        visualizationConfig {
          slug
        }
      }
    }
  `;
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
  const query = `
    mutation deleteVisualizationConfig($id: ID!) {
      deleteVisualizationConfig(input: { id: $id }) {
        visualizationConfig {
          ...visualizationConfig
        }
      }
    }
    ${visualizationConfig}
  `;
  return terrasoApi.requestGraphQL(query, {
    id: config.id,
  });
};

export const fetchVisualizationConfig = ({ groupSlug, configSlug }) => {
  const query = `
    query fetchVisualizationConfig($groupSlug: String!, $configSlug: String!){
      visualizationConfigs(dataEntry_Groups_Slug: $groupSlug, slug: $configSlug) {
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
    ${dataEntry}
    ${visualizationConfigWithConfiguration}
  `;
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
