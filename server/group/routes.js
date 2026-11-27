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

const express = require('express');
const config = require('../config');
const { fetchWithTimeout } = require('../utils/fetch');
const { getCachedHtml } = require('../utils/clientBundle');
const { injectMetaTags } = require('../utils/metaTags');

const router = express.Router();
const safeSlug = slug => /^[a-zA-Z0-9_-]+$/.test(slug);
const query = `query GroupMetadata($slug: String!) {
  groups(slug: $slug) {
    edges { node { slug name description } }
  }
}`;

router.get('/:slug', async (req, res, next) => {
  const { slug } = req.params;
  if (!safeSlug(slug) || slug.toLowerCase() === 'new') return next();

  try {
    const response = await fetchWithTimeout(
      `${config.apiUrl}/graphql/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { slug } }),
      },
      config.apiTimeout
    );
    if (!response.ok) return next();
    const result = await response.json();
    const edges = result.data?.groups?.edges;
    if (result.errors || !Array.isArray(edges) || edges.length !== 1) return next();
    const group = edges[0]?.node;
    if (!group || group.slug !== slug || !group.name) return next();

    const canonical = `${config.baseUrl.replace(/\/$/, '')}/groups/${slug}`;
    if (req.path.endsWith('/')) {
      const queryIndex = req.originalUrl.indexOf('?');
      const search = queryIndex < 0 ? '' : req.originalUrl.slice(queryIndex);
      return res.redirect(301, `/groups/${slug}${search}`);
    }
    return res.send(injectMetaTags(getCachedHtml(), {
      title: `${group.name} | Terraso`,
      description: group.description?.trim() || `${group.name} | Terraso`,
      canonical,
    }));
  } catch (error) {
    console.error('Error processing group:', error.message);
    return next();
  }
});

module.exports = router;
