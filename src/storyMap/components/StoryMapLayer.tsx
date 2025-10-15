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

import GeoJsonSource from 'gis/components/GeoJsonSource';
import VisualizationMapLayer from 'sharedData/visualization/components/VisualizationMapLayer';
import VisualizationMapRemoteSource from 'sharedData/visualization/components/VisualizationMapRemoteSource';
import type { MapLayerConfig } from 'storyMap/storyMapTypes';

type Props = {
  config: MapLayerConfig;
  changeBounds: boolean;
  useConfigBounds?: boolean;
  opacity?: number;
};
export const StoryMapLayer = ({
  config,
  changeBounds,
  opacity,
  useConfigBounds = false,
}: Props) => {
  const useTileset =
    config.mapboxTilesetStatus === 'READY' && Boolean(config.mapboxTilesetId);
  return (
    <>
      {useTileset ? (
        <VisualizationMapRemoteSource
          sourceName={config.id}
          visualizationConfig={config}
        />
      ) : (
        <GeoJsonSource id={config.id} geoJson={config.geojson} />
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
