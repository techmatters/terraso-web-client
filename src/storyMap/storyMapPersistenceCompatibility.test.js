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

import {
  fetchStoryMap,
  fetchStoryMapForm,
  updateStoryMap,
} from 'terraso-web-client/storyMap/storyMapService';

jest.mock('terraso-client-shared/terrasoApi/api');

test('public and editor loads expose the first item without losing the collection', async () => {
  const first = { type: 'image/png', signedUrl: 'first' };
  const second = { type: 'audio/mpeg', signedUrl: 'second' };
  const config = { chapters: [{ id: 'one', mediaItems: [first, second] }] };
  terrasoApi.requestGraphQL.mockResolvedValue({
    storyMaps: {
      edges: [
        {
          node: {
            configuration: JSON.stringify(config),
            membershipList: { memberships: { edges: [] } },
          },
        },
      ],
    },
  });

  for (const fetch of [fetchStoryMap, fetchStoryMapForm]) {
    const result = await fetch({ slug: 'slug', storyMapId: 'id' });
    expect(result.config.chapters[0]).toEqual(
      expect.objectContaining({ media: first, mediaItems: [first, second] })
    );
  }
});

test('saving legacy and collection chapters preserves media and reads the saved configuration', async () => {
  const legacy = { type: 'image/png', contentId: 'new-file' };
  const first = { type: 'image/png', url: 'first' };
  const second = { type: 'image/png', url: 'second' };
  const config = {
    title: 'Story',
    chapters: [
      { id: 'legacy', media: legacy },
      {
        id: 'collection',
        media: first,
        mediaItems: [first, second],
        mediaPresentation: 'gallery',
      },
    ],
  };
  const savedFirst = { ...first, signedUrl: 'signed-first' };
  const responseConfig = {
    title: 'Story',
    chapters: [
      {
        id: 'legacy',
        mediaItems: [{ type: 'image/png', url: 'uploaded' }],
        mediaPresentation: 'carousel',
      },
      {
        id: 'collection',
        mediaItems: [savedFirst, second],
        mediaPresentation: 'gallery',
      },
    ],
  };
  terrasoApi.request.mockResolvedValue({
    configuration: JSON.stringify(responseConfig),
  });

  const result = await updateStoryMap({
    storyMap: { id: 'id', config },
    files: {},
  });
  const body = terrasoApi.request.mock.calls[0][0].body;
  expect(JSON.parse(body.get('configuration'))).toEqual({
    title: 'Story',
    chapters: [
      { id: 'legacy', mediaItems: [legacy], mediaPresentation: 'carousel' },
      {
        id: 'collection',
        mediaItems: [first, second],
        mediaPresentation: 'gallery',
      },
    ],
  });
  expect(result.config.chapters[0].media.url).toBe('uploaded');
  expect(result.config.chapters[1]).toEqual(
    expect.objectContaining({
      media: savedFirst,
      mediaItems: [savedFirst, second],
    })
  );
});
