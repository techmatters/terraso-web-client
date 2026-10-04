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

/**
 * Custom property carrying {@link CHAPTER_ONLY_CONTENT_MAX_WIDTH} onto the
 * chapter container. The CSS rule on `.step-content` consumes the VAR — the
 * constant is the single owner of the value (see `StoryMap.css`). The
 * editor's chapter form never sets the var, and the rule's `none` fallback
 * keeps the editable card at its full editing width.
 */
export const CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR =
  '--chapter-only-content-max-width';

export type ChapterRenderMode = 'card' | 'mapOnly' | 'chapterOnly';

export type ChapterRenderPolicy = {
  /** How the chapter SHELL renders (see {@link chapterShell}). */
  shell: ChapterRenderMode;
  /** CSS class of the shell (`ALIGNMENTS` lookup, `centered` fallback). */
  alignmentClass: string;
  /** Whether authored content (title/media/description) is rendered. */
  rendersContent: boolean;
  /** Whether the shell's background covers the map area (`justChapter`). */
  coversMap: boolean;
  /** Full-viewport scroll span (`100vh` / `100cqh`), or undefined for cards. */
  spanHeight: (isContained: boolean) => string | undefined;
  /** Whether the step's camera transition runs. */
  cameraMode: 'run' | 'skip';
  /**
   * Layer visibility output while the step is active: the authored model, or
   * a display-side override forcing every candidate off (`justChapter`).
   */
  layerPolicy: 'model' | 'force-off-display';
  /** Bounds recording/display region: the card's uncovered strip, or full. */
  boundsRegion: 'content-strip' | 'full';
  /** Alignment to use for bounds compensation (mobile degrades to center). */
  boundsAlignment: ChapterAlignment;
};

/**
 * THE ONE PLACE "how does this chapter render" is answered. All shell sites
 * (`StoryMap.jsx`'s `Chapter`) and all viewer gates (`mapUtils.ts`: camera
 * skip, layer forcing, bounds compensation) consume this policy instead of
 * ad-hoc predicates. (Named `chapterShell` rather than `chapterRenderPolicy`
 * only because ESLint's aggressive testing-library heuristic treats any
 * call containing "render" as a `render()` result.)
 *
 * The `alignment` field CONFLATES card position and render mode (see the
 * schema-debt note on `ChapterAlignment` in `storyMapTypes.ts`), so the
 * policy folds in the two modifiers that change what the mode MEANS:
 *
 * - `isMobile` (xs viewport): the just-modes' "map invisible" premise is
 *   false there — the map is a visible 33vh band no card can cover. The
 *   modes degrade to `center` semantics: normal card rendering (content
 *   shown), camera transitions run, no layer forcing.
 * - `hidden`: a hidden chapter performs NO render-mode semantics — `hidden`
 *   wins over the mode's camera skip and layer forcing (the map behind the
 *   invisible card stays alive). The shell shape (span/classes) is kept: a
 *   hidden chapter's scroll span is exactly why `hidden` exists.
 */
export const chapterShell = ({
  alignment,
  hidden,
  isMobile,
}: {
  alignment?: ChapterAlignment;
  hidden?: boolean;
  isMobile?: boolean;
}): ChapterRenderPolicy => {
  const justMode = isMapOnly(alignment) || isChapterOnly(alignment);
  const effective = justMode && isMobile ? 'center' : alignment;
  const shell: ChapterRenderMode = isMapOnly(effective)
    ? 'mapOnly'
    : isChapterOnly(effective)
      ? 'chapterOnly'
      : 'card';
  const coversMap = shell === 'chapterOnly';
  // `hidden` wins: no camera skip, no layer forcing.
  const modeSemantics = coversMap && !hidden;
  return {
    shell,
    alignmentClass: (effective && ALIGNMENTS[effective]) || 'centered',
    rendersContent: shell !== 'mapOnly',
    coversMap,
    spanHeight: isContained =>
      shell === 'card' ? undefined : isContained ? '100cqh' : '100vh',
    cameraMode: modeSemantics ? 'skip' : 'run',
    layerPolicy: modeSemantics ? 'force-off-display' : 'model',
    boundsRegion: isSideCardAlignment(alignment) ? 'content-strip' : 'full',
    boundsAlignment: effective ?? 'center',
  };
};

export const MEMBERSHIP_ROLE_EDITOR = 'editor';
export const MEMBERSHIP_ROLE_OWNER = 'owner';

export const STORY_MAP_TITLE_ID = 'story-map-title';
