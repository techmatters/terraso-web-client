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

import GeoJsonSource from 'terraso-web-client/gis/components/GeoJsonSource';
import VisualizationMapLayer from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import VisualizationMapRemoteSource from 'terraso-web-client/sharedData/visualization/components/VisualizationMapRemoteSource';
import type { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

type Props = {
  config: MapLayerConfig;
  /** Fit the map to this layer's bounds: truthy triggers the fit (a seq
   * number lets the host re-trigger a fit for the same layer). */
  changeBounds: boolean | number;
  /**
   * When true, the `changeBounds` fit is skipped while any part of the layer
   * is already visible (zoom out to the viewport ∪ layer union only when the
   * layer is completely outside the viewport). Used by the map configuration
   * editor's layer-add preview.
   */
  avoidMoveWhenVisible?: boolean;
  useConfigBounds?: boolean;
  opacity?: number;
  onSourceError?: (error: unknown) => void;
  onLayerAdded?: (layerId: string) => void;
};

const getSourceType = (config: MapLayerConfig): 's3' | 'tileset' => {
  if (config.geojsonSignedUrl) {
    return 's3';
  }
  if (
    config.mapboxTilesetStatus === 'READY' &&
    Boolean(config.mapboxTilesetId)
  ) {
    return 'tileset';
  }
  throw new Error(
    'Invalid MapLayerConfig: should have a GeoJSON URL or valid Mapbox tileset'
  );
};

export const StoryMapLayer = ({
  config,
  changeBounds,
  avoidMoveWhenVisible,
  opacity,
  useConfigBounds = false,
  onSourceError,
  onLayerAdded,
}: Props) => {
  const sourceType = getSourceType(config);
  const useTileset = sourceType === 'tileset';

  return (
    <>
      {sourceType === 'tileset' ? (
        <VisualizationMapRemoteSource
          sourceName={config.id}
          visualizationConfig={config}
        />
      ) : (
        <GeoJsonSource
          id={config.id}
          geoJsonUrl={sourceType === 's3' ? config.geojsonSignedUrl : undefined}
          onError={onSourceError}
        />
      )}
      <VisualizationMapLayer
        sourceName={config.id}
        visualizationConfig={config}
        showPopups={false}
        useTileset={useTileset}
        changeBounds={changeBounds}
        avoidMoveWhenVisible={avoidMoveWhenVisible}
        useConfigBounds={useConfigBounds}
        opacity={opacity}
        onLayerAdded={onLayerAdded}
      />
    </>
  );
};
