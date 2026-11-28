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
const { fetchPublicMetadata } = require('../utils/publicMetadata');
const { getCachedHtml } = require('../utils/clientBundle');
const { injectMetaTags } = require('../utils/metaTags');

const router = express.Router();
const safeSlug = slug => /^[a-zA-Z0-9_-]+$/.test(slug);
const query = `query LandscapeMetadata($slug: String!) {
  landscapes(slug: $slug) {
    edges { node { slug name description profileImage } }
  }
}`;

router.get('/:slug/profile', async (req, res, next) => {
  const { slug } = req.params;
  if (!safeSlug(slug)) return next();

  try {
    const landscape = await fetchPublicMetadata(query, 'landscapes', slug);
    if (!landscape) return next();

    const canonical = `${config.baseUrl.replace(/\/$/, '')}/landscapes/${slug}/profile`;
    if (req.path.endsWith('/')) {
      const queryIndex = req.originalUrl.indexOf('?');
      const search = queryIndex < 0 ? '' : req.originalUrl.slice(queryIndex);
      return res.redirect(301, `/landscapes/${slug}/profile${search}`);
    }
    return res.send(injectMetaTags(getCachedHtml(), {
      title: `${landscape.name} Profile | Terraso`,
      description: landscape.description?.trim(),
      image: landscape.profileImage,
      canonical,
    }));
  } catch (error) {
    console.error('Error processing landscape:', error.message);
    return next();
  }
});

module.exports = router;
