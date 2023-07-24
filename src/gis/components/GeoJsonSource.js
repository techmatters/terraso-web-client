import { useEffect } from 'react';

import { useMap } from './MapboxMap';

const GeoJsonSource = props => {
  const { id, geoJson } = props;
  const { map, addSource } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    addSource(id, {
      type: 'geojson',
      data: geoJson ? geoJson : { type: 'FeatureCollection', features: [] },
    });
  }, [id, map, addSource, geoJson]);
};

export default GeoJsonSource;
