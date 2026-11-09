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

import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import { updateStoryMap } from 'terraso-web-client/storyMap/storyMapService';

jest.mock('terraso-client-shared/terrasoApi/api');

const STORY_MAP_ID = 'story-map-id';
const PUBLISHED_AT = '2026-11-09T00:00:00Z';
const CONFIG = { title: 'Updated map', chapters: [] };

const storyMap = {
  id: STORY_MAP_ID,
  config: CONFIG,
  publish: true,
};

const restResponse = ({ isPublished, publishedAt }) => ({
  id: STORY_MAP_ID,
  title: CONFIG.title,
  story_map_id: 'map-slug-id',
  created_by: 'creator-id',
  configuration: CONFIG,
  is_published: isPublished,
  published_at: publishedAt,
  featured: false,
  slug: 'updated-map',
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('updateStoryMap maps REST fields without retaining raw field names', async () => {
  terrasoApi.request.mockResolvedValue(
    restResponse({ isPublished: true, publishedAt: PUBLISHED_AT })
  );

  const result = await updateStoryMap({ storyMap, files: {} });

  expect(result).toEqual({
    id: STORY_MAP_ID,
    title: CONFIG.title,
    storyMapId: 'map-slug-id',
    publishedAt: PUBLISHED_AT,
    configuration: CONFIG,
    config: CONFIG,
    isPublished: true,
    featured: false,
    slug: 'updated-map',
  });
});

test('unpublish keeps the backend false and null publication values', async () => {
  terrasoApi.request.mockResolvedValue(
    restResponse({ isPublished: false, publishedAt: null })
  );

  const result = await updateStoryMap({
    storyMap: { id: STORY_MAP_ID, unpublish: true },
    files: {},
  });

  expect(result).toEqual({
    id: STORY_MAP_ID,
    isPublished: false,
    publishedAt: null,
  });
});
