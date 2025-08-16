import type { GeoJSON } from 'geojson';
import { VisualizationConfigNode } from 'terrasoApi/shared/graphqlSchema/graphql';

import GeoJsonSource from 'gis/components/GeoJsonSource';
import VisualizationMapLayer from 'sharedData/visualization/components/VisualizationMapLayer';
import VisualizationMapRemoteSource from 'sharedData/visualization/components/VisualizationMapRemoteSource';

type MapLayerConfig = VisualizationConfigNode & {
  geojson?: GeoJSON;
};

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
        showPopup={false}
        useTileset={useTileset}
        changeBounds={changeBounds}
        useConfigBounds={useConfigBounds}
        opacity={opacity}
      />
    </>
  );
};
