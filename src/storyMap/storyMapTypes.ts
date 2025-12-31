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
import { LngLat, LngLatBounds } from 'mapbox-gl';
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
  geojson?: GeoJSON;
};

export type MapPosition = {
  center: LngLat;
  bearing: number;
  pitch: number;
  zoom: number;
  bounds: LngLatBounds;
};

export type ChapterConfig = {
  id: string;
  title: string;
  description: Descendant;
  alignment: 'left' | 'right' | 'center';
  rotateAnimation: boolean;
  mapAnimation: 'flyTo' | 'jumpTo';
  media: {
    type: 'image' | 'video' | 'embedded';
    url: string;
    signedUrl: string;
  };
  location: MapPosition;
  onChapterEnter: [
    {
      layer: string;
      opacity: number;
    },
  ];
  onChapterExit: [
    {
      layer: string;
      opacity: number;
    },
  ];
};

export type StoryMapConfig = {
  style: string;
  theme: 'dark' | 'light';
  showMarkers: boolean;
  use3dTerrain: boolean;
  title: string;
  subtitle: string;
  byline: string;
  chapters: ChapterConfig[];
  titleTransition?: {
    location: MapPosition;
  };
  projection?: string;
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
