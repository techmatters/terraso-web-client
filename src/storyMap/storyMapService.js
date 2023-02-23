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

import * as terrasoApi from 'terrasoBackend/api';

import { storyMapFields } from './storyMapFragments';

export const fetchSamples = (params, currentUser) => {
  const query = `
    query home($accountEmail: String!) {
      storyMaps(createdBy_Email_Not: $accountEmail) {
        edges {
          node {
            ...storyMapFields
          }
        }
      }
    }
    ${storyMapFields}
  `;
  return terrasoApi
    .requestGraphQL(query, { accountEmail: currentUser.email })
    .then(response => ({
      storyMaps: _.getOr([], 'storyMaps.edges', response).map(_.get('node')),
    }));
};

export const fetchStoryMap = ({ slug }) => {
  const query = `
    query fetchStoryMap($slug: String!){
      storyMaps(slug: $slug) {
        edges {
          node {
            ...storyMapFields
          }
        }
      }
    }
    ${storyMapFields}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('storyMaps.edges[0].node'))
    .then(storyMap => storyMap || Promise.reject('not_found'))
    .then(storyMap => ({
      ...storyMap,
      config: JSON.parse(storyMap.configuration),
    }));
};

export const deleteStoryMap = storyMap => {
  const query = `
    mutation deleteStoryMap($id: ID!) {
      deleteStoryMap(input: { id: $id }) {
        storyMap {
          slug
        }
        errors
      }
    }
  `;
  return terrasoApi.requestGraphQL(query, {
    id: storyMap.id,
  });
};
export const addStoryMap = async ({ storyMap, files }) => {
  const path = '/story-map/add/';

  const body = new FormData();
  body.append('title', storyMap.config.title);
  body.append('is_published', storyMap.published);
  body.append('configuration', JSON.stringify(storyMap.config));
  Object.keys(files).forEach((fileId, index) => {
    const file = files[fileId].file;
    body.append('files', file, fileId);
  });

  const jsonResponse = await terrasoApi.request({ path, body });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};
export const updateStoryMap = async ({ storyMap, files }) => {
  const path = '/story-map/update/';

  const body = new FormData();
  body.append('id', storyMap.id);
  body.append('title', storyMap.config.title);
  body.append('is_published', storyMap.published);
  body.append('configuration', JSON.stringify(storyMap.config));
  Object.keys(files).forEach((fileId, index) => {
    const file = files[fileId].file;
    body.append('files', file, fileId);
  });

  const jsonResponse = await terrasoApi.request({ path, body });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};
