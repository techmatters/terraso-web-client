/*
 * Copyright © 2021-2023 Technology Matters
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

export const LAYER_PAINT_TYPES = {
  fill: ['fill-opacity'],
  line: ['line-opacity'],
  circle: ['circle-opacity', 'circle-stroke-opacity'],
  symbol: ['icon-opacity', 'text-opacity'],
  raster: ['raster-opacity'],
  'fill-extrusion': ['fill-extrusion-opacity'],
  heatmap: ['heatmap-opacity'],
} as const;

export type LayerPaintType = keyof typeof LAYER_PAINT_TYPES;

export const ALIGNMENTS = {
  left: 'lefty',
  center: 'centered',
  right: 'righty',
  full: 'fully',
  justMap: 'map-only',
  justChapter: 'chapter-only',
};

/**
 * Render-mode predicates for {@link ChapterAlignment} — the ONE place the
 * "just" modes are recognized. Keep render-mode special-casing funneled
 * through these instead of spreading string comparisons across the code.
 */
export const isMapOnly = (alignment?: ChapterAlignment): boolean =>
  alignment === 'justMap';

export const isChapterOnly = (alignment?: ChapterAlignment): boolean =>
  alignment === 'justChapter';

/**
 * Whether the chapter card covers one SIDE of the map (`left`/`right`): the
 * only alignments whose recorded bounds are compensated for the uncovered
 * strip (see `mapUtils.ts`). `center` overlaps the middle (never
 * compensated), and the just-modes span the map — neither leaves a strip, so
 * their content region is the full map and their bounds round-trip
 * unchanged.
 */
export const isSideCardAlignment = (alignment?: ChapterAlignment): boolean =>
  alignment === 'left' || alignment === 'right';

/** Max width of the centered content of a `justChapter` chapter card. */
export const CHAPTER_ONLY_CONTENT_MAX_WIDTH = '46rem';

export const MEMBERSHIP_ROLE_EDITOR = 'editor';
export const MEMBERSHIP_ROLE_OWNER = 'owner';

export const STORY_MAP_TITLE_ID = 'story-map-title';
