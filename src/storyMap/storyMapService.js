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

export const fetchSamples = (params, currentUser) => {
  const query = graphql(`
    query storyMapsHome($accountEmail: String!) {
      storyMaps(createdBy_Email_Not: $accountEmail) {
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
      storyMaps: _.getOr([], 'storyMaps.edges', response).map(_.get('node')),
    }));
};

export const fetchStoryMap = ({ slug, storyMapId }) => {
  const query = graphql(`
    query fetchStoryMap($slug: String!, $storyMapId: String!) {
      storyMaps(slug: $slug, storyMapId: $storyMapId) {
        edges {
          node {
            ...storyMapFields
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
      ...storyMap,
      config: JSON.parse(storyMap.configuration),
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
