import { useEffect } from 'react';

import { useMap } from './Map';

const MapboxRemoteSource = props => {
  const { sourceName, visualizationConfig } = props;
  const { map, addSource, removeSource } = useMap();
  const { tilesetId } = visualizationConfig || {};
  useEffect(() => {
    if (!map || !tilesetId) {
      return;
    }

    const currentSource = map.getSource(sourceName);
    if (currentSource) {
      return;
    }

    addSource(sourceName, {
      type: 'vector',
      url: `mapbox://terraso.${tilesetId}`,
    });
  }, [map, addSource, removeSource, tilesetId, sourceName]);
};

export default MapboxRemoteSource;
