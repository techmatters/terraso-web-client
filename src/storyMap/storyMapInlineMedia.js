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

import { normalizeChapterMedia } from 'terraso-web-client/storyMap/storyMapUtils';

const chapterMediaItems = chapter => normalizeChapterMedia(chapter).mediaItems;

export const collectInlineCollectionIds = (nodes, ids = new Set()) => {
  if (Array.isArray(nodes)) {
    nodes.forEach(node => {
      if (node?.type === 'media-collection' && node.collectionId != null) {
        ids.add(node.collectionId);
      }
      collectInlineCollectionIds(node?.children, ids);
    });
  }
  return ids;
};

export const reconcileChapterDescription = (chapter, description) => {
  const previousIds = collectInlineCollectionIds(chapter.description);
  const nextIds = collectInlineCollectionIds(description);
  const removedIds = [...previousIds].filter(id => !nextIds.has(id));
  return {
    ...chapter,
    description,
    ...(removedIds.length
      ? {
          mediaItems: chapterMediaItems(chapter).filter(
            item => !removedIds.includes(item.inlineCollectionId)
          ),
        }
      : {}),
  };
};

export const chapterHeaderMediaItems = chapter =>
  chapterMediaItems(chapter).filter(item => item.inlineCollectionId == null);

export const replaceChapterHeaderMediaItems = (chapter, items) => [
  ...items,
  ...chapterMediaItems(chapter).filter(item => item.inlineCollectionId != null),
];

export const inlineCollectionItems = (chapter, collectionId) =>
  chapterMediaItems(chapter).filter(
    item => item.inlineCollectionId === collectionId
  );

export const replaceInlineCollectionItems = (chapter, collectionId, items) => [
  ...chapterMediaItems(chapter).filter(
    item => item.inlineCollectionId !== collectionId
  ),
  ...items.map(item => ({ ...item, inlineCollectionId: collectionId })),
];
