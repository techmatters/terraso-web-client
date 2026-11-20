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

export type PanelSide = 'left' | 'right';

/**
 * Horizontal strip of the map canvas covered by the active chapter card.
 * `width` is measured in CSS pixels from the covered edge to the card's border
 * box, so it includes the story map's own gutters.
 */
export type PanelInset = { side: PanelSide | null; width: number };

export type MapPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type Rect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
};

export const NO_PANEL_INSET: PanelInset = { side: null, width: 0 };

// Cards are declared up to 50vw (media chapters) plus the story map gutters,
// though `.step-content` caps them at 35vw today. Cap the inset anyway so a
// narrow or nested map cannot hand the whole canvas to the panel.
export const MAX_PANEL_FRACTION = 0.6;

export const panelSideFor = (
  alignment: ChapterAlignment | null | undefined,
  isMobile: boolean
): PanelSide | null => {
  // On mobile the map is a strip above the chapters and cards are full width,
  // so no card overlays the map.
  if (isMobile) {
    return null;
  }
  return alignment === 'left' || alignment === 'right' ? alignment : null;
};

/**
 * Derive the inset from the rendered card, clamping to the visible map width.
 * The rect is taken from the layout rather than from the map's dimensions
 * because the card width depends on viewport units, the presence of visual
 * media and the story map's own gutters.
 */
export const insetFromRect = ({
  cardRect,
  mapRect,
  side,
  maxFraction = MAX_PANEL_FRACTION,
}: {
  cardRect: Rect;
  mapRect: Rect;
  side: PanelSide | null;
  maxFraction?: number;
}): PanelInset => {
  if (!side || cardRect.width <= 0 || mapRect.width <= 0) {
    return NO_PANEL_INSET;
  }

  const covered =
    side === 'left'
      ? cardRect.right - mapRect.left
      : mapRect.right - cardRect.left;
  const max = mapRect.width * maxFraction;
  const width = Math.round(Math.min(Math.max(covered, 0), Math.max(max, 0)));

  return width > 0 ? { side, width } : NO_PANEL_INSET;
};

export const insetsEqual = (a: PanelInset, b: PanelInset) =>
  a.side === b.side && Math.abs(a.width - b.width) < 1;

export const paddingForInset = (inset: PanelInset): MapPadding => {
  if (inset.side === 'left') {
    return { top: 0, right: 0, bottom: 0, left: inset.width };
  }
  if (inset.side === 'right') {
    return { top: 0, right: inset.width, bottom: 0, left: 0 };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
};

export type MeasurePanelInsetOptions = {
  mapContainer: HTMLElement | null | undefined;
  chapterId: string | null | undefined;
  alignment: ChapterAlignment | null | undefined;
  isMobile: boolean;
};

/**
 * Measure the active chapter card against the map container.
 *
 * Custom chapter components that do not render a `.step-content` card simply
 * report no panel, which falls back to a centered projection.
 */
export const measurePanelInset = ({
  mapContainer,
  chapterId,
  alignment,
  isMobile,
}: MeasurePanelInsetOptions): PanelInset => {
  const side = panelSideFor(alignment, isMobile);
  if (!side || !mapContainer || !chapterId) {
    return NO_PANEL_INSET;
  }

  const card = document
    .getElementById(chapterId)
    ?.querySelector('.step-content');
  if (!card) {
    return NO_PANEL_INSET;
  }

  return insetFromRect({
    cardRect: card.getBoundingClientRect(),
    mapRect: mapContainer.getBoundingClientRect(),
    side,
  });
};

export const getPanelCard = (
  chapterId: string | null | undefined,
  alignment: ChapterAlignment | null | undefined,
  isMobile: boolean
): Element | null => {
  if (panelSideFor(alignment, isMobile) === null || !chapterId) {
    return null;
  }
  return (
    document.getElementById(chapterId)?.querySelector('.step-content') ?? null
  );
};
