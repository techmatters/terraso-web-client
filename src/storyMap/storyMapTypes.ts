/*
 * Copyright © 2025 Technology Matters
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

import type { GeoJSON } from 'geojson';
import { LngLat } from 'mapbox-gl';
import { Descendant } from 'slate';
import type {
  DataEntryNode,
  VisualizationConfigNode,
} from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';

export type VisualizeConfig = {
  shape: 'circle' | 'square' | 'hexagon' | 'triangle';
  opacity: number;
  size: number;
  color: string;
};

export type MapLayerConfig = VisualizationConfigNode & {
  ownerType: 'StoryMapNode' | 'GroupNode' | 'LandscapeNode';
  /** Stable id of the owning group/landscape, when applicable. */
  ownerId?: string;
  /** Display name of the owning group/landscape, when applicable. */
  ownerName?: string;
  visualizeConfig?: VisualizeConfig;
};

export type MapPosition = {
  center: LngLat;
  bearing: number;
  pitch: number;
  zoom: number;
  bounds: MapBounds;
};

export type LayerConfig = {
  layer: string;
  opacity: number;
  duration?: number;
};

/** Reference to a map layer shown during a transition. */
export type MapLayerTransition = {
  layerId: string;
};

/**
 * One row of a transition's ordered layer list (index 0 = topmost).
 * `config` is null for layer refs that resolve neither in the stored
 * `dataLayers` payload nor in the fetched layer index (dangling/unknown
 * refs): the row is kept and rendered as unknown — unknown data is never
 * silently dropped.
 */
export type MapLayerDraftRow = {
  layerId: string;
  config: MapLayerConfig | null;
};

export type Transition = {
  location: MapPosition & { duration?: number };
  rotateAnimation?: boolean;
  mapAnimation?: 'flyTo' | 'easeTo';
  /**
   * Ordered list of the map layers shown during this transition.
   * Index 0 is the topmost layer on the map.
   * When absent, the legacy single-layer fields below are used instead.
   */
  mapLayers?: MapLayerTransition[];
  /**
   * @deprecated DERIVED compat field: the single-layer reference regenerated
   * from {@link Transition.mapLayers} + `dataLayers` on every config write
   * (see `syncTransitionLayerFields` in mapLayerUtils.ts — the ONLY writer).
   * It points at the most recently added layer (topmost newly added one),
   * stays put across reorders and removals of other layers, and is repointed
   * to the topmost remaining layer (or cleared) when the layer it pointed at
   * is removed.
   *
   * Read by ALL viewers (including new ones) for layer visibility —
   * never hand-edit; do not remove. When `mapLayers` is present, readers
   * prefer it and this field is only a compat fallback. Mid-rollout
   * divergence: configs written by the OLD editor have no `mapLayers`; new
   * readers then fall back to this field (legacy single-layer behavior).
   * Transitions without `mapLayers` are never migrated on load.
   */
  dataLayerConfigId?: string;
  /**
   * @deprecated DERIVED compat field: layer fade-in events regenerated from
   * {@link Transition.mapLayers} + `dataLayers` on every config write (see
   * `syncTransitionLayerFields` in mapLayerUtils.ts — the ONLY writer). It
   * contains one entry per sublayer of every layer in `mapLayers`; hand-made
   * entries whose `layer` is not a generated data-layer sublayer id are
   * preserved. Read by ALL viewers (including new ones) for layer visibility
   * (`startLayerTransition` in mapUtils.ts) — never hand-edit; do not remove.
   */
  onChapterEnter?: LayerConfig[];
  /**
   * @deprecated DERIVED compat field: layer fade-out events, see
   * {@link Transition.onChapterEnter}.
   */
  onChapterExit?: LayerConfig[];
};

export type ChapterAlignment =
  | 'left'
  | 'right'
  | 'center'
  /**
   * Render mode: the chapter renders NOTHING over the map (no content, no
   * background) for its scroll span — just the map. The camera transition
   * still runs. Config content is preserved (toggle-safe).
   */
  | 'justMap'
  /**
   * Render mode: a full-width chapter card whose background covers the map
   * area, content vertically centered with a max width. All map layers are
   * forced off (display-side only) and the camera transition is skipped
   * while this chapter is active. Config content is preserved (toggle-safe).
   */
  | 'justChapter';

/**
 * swLng, swLat, neLng, neLat
 */
export type MapBounds = [number, number, number, number];

export type ChapterConfig = {
  id: string;
  title: string;
  description: Descendant;
  alignment: ChapterAlignment;
  media: {
    type: 'image' | 'video' | 'embedded';
    url: string;
    signedUrl: string;
  };
} & Transition;

export type StoryMapThemeId =
  | 'theme-1'
  | 'theme-2'
  | 'theme-3'
  | 'theme-4'
  | 'theme-5'
  | 'theme-6'
  | 'theme-7'
  | 'theme-8';

export type StoryMapConfig = {
  style: string;
  themeId: StoryMapThemeId;
  showMarkers: boolean;
  use3dTerrain: boolean;
  title: string;
  subtitle: string;
  byline: string;
  chapters: ChapterConfig[];
  titleTransition?: Transition;
  projection?: string;
  dataLayers?: Record<string, MapLayerConfig>;
};

export type VisualizationConfigForm = {
  selectedFile: DataEntryNode | undefined;
  visualizeConfig: VisualizeConfig;
  annotateConfig: {
    dataPoints: [];
    mapTitle?: string;
  };
  datasetConfig?: {
    latitude: number;
    longitude: number;
  };
};
