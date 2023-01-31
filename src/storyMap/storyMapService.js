import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';

import { storyMapFields } from './storyMapFragments';

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

export const addStoryMap = ({ config, published }) => {
  const query = `
    mutation addStoryMap($input: StoryMapAddMutationInput!) {
      addStoryMap(input: $input) {
        storyMap {
          slug
        }
        errors
      }
    }
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        title: config.title,
        isPublished: published,
        configuration: JSON.stringify(config),
      },
    })
    .then(response => ({
      slug: _.get('addStoryMap.storyMap.slug', response),
    }));
};

export const updateStoryMap = ({ id, config, published }) => {
  const query = `
    mutation updateStoryMap($input: StoryMapUpdateMutationInput!) {
      updateStoryMap(input: $input) {
        storyMap {
          slug
        }
        errors
      }
    }
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        id,
        title: config.title,
        isPublished: published,
        configuration: JSON.stringify(config),
      },
    })
    .then(response => ({
      slug: _.get('updateStoryMap.storyMap.slug', response),
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
