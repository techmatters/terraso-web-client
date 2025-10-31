import type { GeoJSON } from 'geojson';
import { Descendant } from 'slate';
import type { VisualizationConfigNode } from 'terrasoApi/shared/graphqlSchema/graphql';

export type MapLayerConfig = VisualizationConfigNode & {
  geojson?: GeoJSON;
};

export type Position = {
  center: number;
  zoom: number;
  pitch: number;
  bearing: number;
  bounds: number;
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
  location: {
    center: {
      lat: number;
      lng: number;
    };
    zoom: number;
    pitch: number;
    bearing: number;
  };
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
    location: Position;
  };
  projection?: string;
};
