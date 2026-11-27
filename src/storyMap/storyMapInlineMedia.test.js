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
  chapterHeaderMediaItems,
  inlineCollectionItems,
  replaceChapterHeaderMediaItems,
  replaceInlineCollectionItems,
} from 'terraso-web-client/storyMap/storyMapInlineMedia';

test('header and inline collections coexist in their own order', () => {
  const header1 = { id: 'header-1' };
  const header2 = { id: 'header-2' };
  const inline1 = { id: 'inline-1', inlineCollectionId: 'a' };
  const inline2 = { id: 'inline-2', inlineCollectionId: 'a' };
  const other = { id: 'other', inlineCollectionId: 'b' };
  const chapter = { mediaItems: [header1, inline1, other, header2, inline2] };

  expect(chapterHeaderMediaItems(chapter)).toEqual([header1, header2]);
  expect(inlineCollectionItems(chapter, 'a')).toEqual([inline1, inline2]);
  expect(inlineCollectionItems(chapter, 'b')).toEqual([other]);
  expect(inlineCollectionItems(chapter, 'missing')).toEqual([]);
});

test('replacing header media preserves inline collections and their order', () => {
  const inline1 = { id: 'inline-1', inlineCollectionId: 'a' };
  const inline2 = { id: 'inline-2', inlineCollectionId: 'b' };
  const chapter = {
    mediaItems: [{ id: 'old-header' }, inline1, inline2],
  };
  const newHeader = [{ id: 'new-header' }];

  expect(replaceChapterHeaderMediaItems(chapter, newHeader)).toEqual([
    ...newHeader,
    inline1,
    inline2,
  ]);
  expect(chapter.mediaItems[0].id).toBe('old-header');
});

test('replacing one inline collection preserves other media and supplied order', () => {
  const header = { id: 'header' };
  const previous = { id: 'old', inlineCollectionId: 'a' };
  const other = { id: 'other', inlineCollectionId: 'b' };
  const chapter = { title: 'Chapter', mediaItems: [header, previous, other] };
  const items = [
    { id: 'new-2', contentId: 'content-2', altText: 'Second' },
    { id: 'new-1', contentId: 'content-1', crop: { scale: 2 } },
  ];

  const result = {
    ...chapter,
    mediaItems: replaceInlineCollectionItems(chapter, 'a', items),
  };

  expect(result).not.toBe(chapter);
  expect(result.title).toBe('Chapter');
  expect(chapterHeaderMediaItems(result)).toEqual([header]);
  expect(inlineCollectionItems(result, 'b')).toEqual([other]);
  expect(inlineCollectionItems(result, 'a')).toEqual(
    items.map(item => ({ ...item, inlineCollectionId: 'a' }))
  );
  expect(chapter.mediaItems).toEqual([header, previous, other]);
  expect(items[0]).not.toHaveProperty('inlineCollectionId');
  expect(
    inlineCollectionItems(
      { ...result, mediaItems: replaceInlineCollectionItems(result, 'a', []) },
      'b'
    )
  ).toEqual([other]);
});

test('legacy media is retained as header media unless mediaItems explicitly replaces it', () => {
  const media = { id: 'legacy', contentId: 'legacy-content' };
  const chapter = { media };
  expect(chapterHeaderMediaItems(chapter)).toEqual([media]);
  expect(chapterHeaderMediaItems({ media, mediaItems: [] })).toEqual([]);
  const updated = {
    ...chapter,
    mediaItems: replaceInlineCollectionItems(chapter, 'a', [{ id: 'inline' }]),
  };
  expect(chapterHeaderMediaItems(updated)).toEqual([media]);
  expect(inlineCollectionItems(updated, 'a')).toEqual([
    { id: 'inline', inlineCollectionId: 'a' },
  ]);
});
