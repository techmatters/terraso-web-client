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

const express = require('express');

const { fetchStoryMap } = require('./service');
const { baseUrl } = require('../config');
const { buildMetaTags } = require('./transformer');
const { injectMetaTags } = require('./metaTags');
const { getCachedHtml, serveClientBundle } = require('../utils/clientBundle');

const router = express.Router();

// Slugs are Django SlugFields; restrict both segments before constructing URLs.
const safeSegment = value => /^[a-zA-Z0-9_-]+$/.test(value);
const storyMapPath = (id, slug) => `/tools/story-maps/${id}/${slug}`;
const queryString = req => {
  const index = req.originalUrl.indexOf('?');
  return index < 0 ? '' : req.originalUrl.slice(index);
};

const handleStoryMapRequest = async (req, res, next) => {
  try {
    const { storyMapId } = req.params;
    const slug = req.params.slug ?? '';

    // Match the backend StoryMap.story_map_id max length.
    if (Array.from(storyMapId).length > 10) {
      return serveClientBundle(res, next, 404);
    }

    const storyMapNode = await fetchStoryMap(storyMapId, slug);
    if (storyMapNode.isPublished !== true) {
      return next();
    }
    const metaTags = buildMetaTags(storyMapNode);
    const isPublicViewer =
      storyMapNode.slug === slug &&
      safeSegment(storyMapId) &&
      (slug === '' || safeSegment(slug)) &&
      slug !== 'edit' &&
      slug !== 'embed';

    if (isPublicViewer) {
      const path = storyMapPath(storyMapId, slug);
      if (req.route.path === '/:storyMapId' && !req.path.endsWith('/')) {
        return res.redirect(301, path + queryString(req));
      }
      if (req.path.endsWith('/') && req.route.path === '/:storyMapId/:slug') {
        return res.redirect(301, path + queryString(req));
      }
      metaTags.canonical = `${baseUrl.replace(/\/$/, '')}${path}`;
    }

    const updatedHtml = injectMetaTags(getCachedHtml(), metaTags);

    res.send(updatedHtml);
  } catch (error) {
    console.error('Error processing story map:', error.message);
    next(error);
  }
};

router.get('/:storyMapId', (req, res, next) => {
  if (['new', 'accept'].includes(req.params.storyMapId)) return next();
  return handleStoryMapRequest(req, res, next);
});
router.get('/:storyMapId/embed', handleStoryMapRequest);
router.get('/:storyMapId/:slug', (req, res, next) => {
  if (req.params.slug === 'edit') return next();
  return handleStoryMapRequest(req, res, next);
});
router.get('/:storyMapId/:slug/embed', handleStoryMapRequest);

module.exports = router;
