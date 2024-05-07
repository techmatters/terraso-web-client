import { useEffect } from 'react';

import { useMap } from 'gis/components/Map';

const MapboxRemoteSource = props => {
  const { sourceName, visualizationConfig } = props;
  const { map, addSource, removeSource } = useMap();
  const { tilesetId } = visualizationConfig || {};
  useEffect(() => {
    if (!map || !tilesetId) {
      return;
    }

    addSource(sourceName, {
      type: 'vector',
      url: `mapbox://terraso.${tilesetId}`,
    });
  }, [map, addSource, removeSource, tilesetId, sourceName]);
};

export default MapboxRemoteSource;
