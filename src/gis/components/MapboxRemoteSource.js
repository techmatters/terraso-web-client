import { useEffect } from 'react';

import { useMap } from './Map';

const MapboxRemoteSource = props => {
  const { visualizationConfig } = props;
  console.log({ visualizationConfig });
  const { map, addSource } = useMap();
  const { tilesetId } = visualizationConfig || {};
  useEffect(() => {
    if (!map || !tilesetId) {
      return;
    }

    addSource('visualization', {
      type: 'vector',
      url: `mapbox://terraso.${tilesetId}`,
    });
  }, [map, addSource, tilesetId]);
};

export default MapboxRemoteSource;
