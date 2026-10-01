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
   * @deprecated Legacy single-layer reference. Use {@link Transition.mapLayers}
   * instead (kept as a compat field for older story map configurations).
   */
  dataLayerConfigId?: string;
  /**
   * @deprecated Compat mechanism driving the viewer's layer fade transitions.
   * Kept in sync with {@link Transition.mapLayers}; do not edit by hand.
   */
  onChapterEnter?: LayerConfig[];
  /**
   * @deprecated Compat mechanism driving the viewer's layer fade transitions.
   * Kept in sync with {@link Transition.mapLayers}; do not edit by hand.
   */
  onChapterExit?: LayerConfig[];
};

export type ChapterAlignment = 'left' | 'right' | 'center';

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
