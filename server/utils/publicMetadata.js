/*
 * Copyright © 2026 Technology Matters
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
const { fetchWithTimeout } = require('./fetch');

const fetchPublicMetadata = async (query, collection, slug) => {
  const response = await fetchWithTimeout(
    `${config.apiUrl}/graphql/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { slug } }),
    },
    config.apiTimeout
  );
  if (!response.ok) return null;
  const result = await response.json();
  const edges = result.data?.[collection]?.edges;
  if (result.errors || !Array.isArray(edges) || edges.length !== 1) return null;
  const node = edges[0]?.node;
  return node && node.slug === slug && node.name ? node : null;
};

module.exports = { fetchPublicMetadata };
