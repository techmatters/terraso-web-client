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
const path = require('path');
const fs = require('fs');

const { fetchStoryMap } = require('./service');
const { buildMetaTags } = require('./transformer');
const { injectMetaTags } = require('./metaTags');

const router = express.Router();

router.get('/:storyMapId/:slug', async (req, res) => {
  try {
    const { storyMapId, slug } = req.params;

    const storyMapNode = await fetchStoryMap(storyMapId, slug);
    const metaTags = buildMetaTags(storyMapNode, storyMapId, slug);

    const html = fs.readFileSync(
      path.join(__dirname, '../../build/index.html'),
      'utf8'
    );

    const updatedHtml = injectMetaTags(html, metaTags);

    res.send(updatedHtml);
  } catch (error) {
    console.error('Error processing story map:', error.message);
    res.sendFile(path.join(__dirname, '../../build/index.html'));
  }
});

module.exports = router;
