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
  changeBounds: boolean;
  useConfigBounds?: boolean;
  opacity?: number;
  onSourceError?: (error: unknown) => void;
};

const getSourceType = (config: MapLayerConfig): 's3' | 'tileset' | 'inline' => {
  if (config.geojsonSignedUrl) {
    return 's3';
  }
  if (
    config.mapboxTilesetStatus === 'READY' &&
    Boolean(config.mapboxTilesetId)
  ) {
    return 'tileset';
  }
  return 'inline';
};

export const StoryMapLayer = ({
  config,
  changeBounds,
  opacity,
  useConfigBounds = false,
  onSourceError,
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
          geoJson={sourceType === 'inline' ? config.geojson : undefined}
          onError={onSourceError}
        />
      )}
      <VisualizationMapLayer
        sourceName={config.id}
        visualizationConfig={config}
        showPopups={false}
        useTileset={useTileset}
        changeBounds={changeBounds}
        useConfigBounds={useConfigBounds}
        opacity={opacity}
      />
    </>
  );
};
