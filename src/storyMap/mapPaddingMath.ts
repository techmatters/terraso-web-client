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

import type { ChapterAlignment } from 'terraso-web-client/storyMap/storyMapTypes';

export type PaddingSide = 'left' | 'right';

export type MapPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type Optional<T> = {
  [K in keyof T]?: T[K] | null;
};

type Rect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
};

export const NO_PADDING: MapPadding = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

// Cards are declared up to 50vw (media chapters) plus the story map gutters,
// though `.step-content` caps them at 35vw today. Cap the padding anyway so a
// narrow or nested map cannot hand the whole canvas to the card.
export const MAX_PADDING_FRACTION = 0.6;

export const paddingEqual = (
  a?: Optional<MapPadding>,
  b?: Optional<MapPadding>
) =>
  (a?.top ?? 0) === (b?.top ?? 0) &&
  (a?.right ?? 0) === (b?.right ?? 0) &&
  (a?.bottom ?? 0) === (b?.bottom ?? 0) &&
  (a?.left ?? 0) === (b?.left ?? 0);

export const paddingSideFor = (
  alignment: ChapterAlignment | null | undefined,
  isMobile: boolean
): PaddingSide | null => {
  // On mobile the map is a strip above the chapters and cards are full width,
  // so no card overlays the map.
  if (isMobile) {
    return null;
  }
  return alignment === 'left' || alignment === 'right' ? alignment : null;
};

/**
 * Derive the padding from the rendered card, clamped to the visible map width.
 * The rect is taken from the layout rather than from the map's dimensions
 * because the card width depends on viewport units, the presence of visual
 * media and the story map's own gutters.
 */
export const paddingFromRect = ({
  cardRect,
  mapRect,
  side,
  maxFraction = MAX_PADDING_FRACTION,
}: {
  cardRect: Rect;
  mapRect: Rect;
  side: PaddingSide | null;
  maxFraction?: number;
}): MapPadding => {
  if (!side || cardRect.width <= 0 || mapRect.width <= 0) {
    return NO_PADDING;
  }

  const covered =
    side === 'left'
      ? cardRect.right - mapRect.left
      : mapRect.right - cardRect.left;
  const max = mapRect.width * maxFraction;
  const width = Math.round(Math.min(Math.max(covered, 0), Math.max(max, 0)));

  if (width <= 0) {
    return NO_PADDING;
  }

  return side === 'left'
    ? { ...NO_PADDING, left: width }
    : { ...NO_PADDING, right: width };
};

export type MeasureMapPaddingOptions = {
  mapContainer: HTMLElement | null | undefined;
  chapterId: string | null | undefined;
  alignment: ChapterAlignment | null | undefined;
  isMobile: boolean;
};

export const getChapterCard = (
  chapterId: string | null | undefined,
  alignment: ChapterAlignment | null | undefined,
  isMobile: boolean
): Element | null => {
  if (paddingSideFor(alignment, isMobile) === null || !chapterId) {
    return null;
  }
  return (
    document.getElementById(chapterId)?.querySelector('.step-content') ?? null
  );
};

/**
 * Measure the active chapter card against the map container.
 *
 * Custom chapter components that do not render a `.step-content` card simply
 * report no padding, which falls back to a centered projection.
 */
export const measureMapPadding = ({
  mapContainer,
  chapterId,
  alignment,
  isMobile,
}: MeasureMapPaddingOptions): MapPadding => {
  const side = paddingSideFor(alignment, isMobile);
  if (!side || !mapContainer) {
    return NO_PADDING;
  }

  const card = getChapterCard(chapterId, alignment, isMobile);
  if (!card) {
    return NO_PADDING;
  }

  return paddingFromRect({
    cardRect: card.getBoundingClientRect(),
    mapRect: mapContainer.getBoundingClientRect(),
    side,
  });
};
