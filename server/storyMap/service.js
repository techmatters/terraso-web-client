/*
 * Copyright © 2025 Technology Matters
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

const config = require('../config');
const { fetchWithTimeout } = require('../utils/fetch');

const STORY_MAP_QUERY = `
  query fetchStoryMapMeta($storyMapId: String!, $slug: String) {
    storyMaps(storyMapId: $storyMapId, slug: $slug) {
      edges {
        node {
          publishedConfiguration
        }
      }
    }
  }
`;

const fetchStoryMap = async (storyMapId, slug) => {
  try {
    const response = await fetchWithTimeout(
      `${config.apiUrl}/graphql/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: STORY_MAP_QUERY,
          variables: { storyMapId, slug },
        }),
      },
      config.apiTimeout
    );

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    const node = result.data?.storyMaps?.edges?.[0]?.node;

    if (!node) {
      throw new Error('Story map not found');
    }

    return node;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: API took too long to respond');
    }
    throw error;
  }
};

module.exports = { fetchStoryMap };
