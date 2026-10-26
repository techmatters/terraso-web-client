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

import {
  chapterHasVisualMedia,
  getStoryMapConfig,
  isChapterEmpty,
} from 'terraso-web-client/storyMap/storyMapUtils';

test('legacy stories retain image metadata when loaded into the multi-media model', () => {
  const media = {
    type: 'image/jpeg',
    contentId: 'image-1',
    altText: 'Mangroves',
    crop: { position: { x: 0.3, y: 0.6 }, scale: 2 },
  };
  const config = getStoryMapConfig({
    configuration: JSON.stringify({ chapters: [{ id: 'chapter-1', media }] }),
  });
  expect(config.chapters[0]).toEqual({
    id: 'chapter-1',
    mediaItems: [media],
    mediaPresentation: 'carousel',
  });
  expect(chapterHasVisualMedia(config.chapters[0])).toBe(true);
  expect(isChapterEmpty(config.chapters[0])).toBe(false);
});

test('new stories preserve ordered media and explicit removal of legacy media', () => {
  const mediaItems = [
    { id: 'audio-1', type: 'audio/mpeg' },
    { id: 'image-1', type: 'image/jpeg' },
  ];
  const config = getStoryMapConfig({
    config: {
      chapters: [
        { mediaItems, mediaPresentation: 'gallery' },
        { media: mediaItems[1], mediaItems: [] },
        {},
      ],
    },
  });
  expect(config.chapters[0].mediaItems).toEqual(mediaItems);
  expect(config.chapters[0].mediaPresentation).toBe('gallery');
  expect(config.chapters[1].mediaItems).toEqual([]);
  expect(config.chapters[2].mediaItems).toEqual([]);
  expect(isChapterEmpty(config.chapters[1])).toBe(true);
});
