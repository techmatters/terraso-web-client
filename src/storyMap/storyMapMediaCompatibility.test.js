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
  normalizeChapterMedia,
  normalizeStoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapUtils';

test('legacy chapter media is normalized without losing its metadata', () => {
  const media = {
    type: 'image/jpeg',
    signedUrl: 'image.jpg',
    altText: 'A tree',
  };
  expect(normalizeChapterMedia({ id: 'chapter', media })).toEqual({
    id: 'chapter',
    mediaItems: [media],
    mediaPresentation: 'carousel',
  });
});

test('normalizing a configuration preserves chapter order and media metadata', () => {
  const media = { type: 'audio/mpeg', url: 'audio.mp3' };
  const config = {
    title: 'Story',
    chapters: [{ id: 'one', media }, { id: 'two' }],
  };

  expect(normalizeStoryMapConfig(config)).toEqual({
    title: 'Story',
    chapters: [
      { id: 'one', mediaItems: [media], mediaPresentation: 'carousel' },
      { id: 'two', mediaItems: [], mediaPresentation: 'carousel' },
    ],
  });
  expect(config.chapters[0].media).toBe(media);
});

test('an explicit empty collection takes precedence over legacy media', () => {
  const chapter = {
    media: { type: 'image/jpeg', signedUrl: 'old.jpg' },
    mediaItems: [],
    mediaPresentation: 'gallery',
  };
  expect(normalizeChapterMedia(chapter)).toEqual({
    mediaItems: [],
    mediaPresentation: 'gallery',
  });
});
