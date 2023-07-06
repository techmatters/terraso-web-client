import { useEffect } from 'react';
import bbox from '@turf/bbox';
import mapboxgl from 'gis/mapbox';
import { useMap } from './MapboxMap';

const GeoJsonSource = props => {
  const { id, geoJson, fitGeoJsonBounds } = props;
  const { map, addSource } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    addSource(id, {
      type: 'geojson',
      data: geoJson ? geoJson : { type: 'FeatureCollection', features: [] },
    });

    if (geoJson && fitGeoJsonBounds) {
      const calculatedBbox = bbox(geoJson);
      const bounds = new mapboxgl.LngLatBounds(
        [calculatedBbox[0], calculatedBbox[1]],
        [calculatedBbox[2], calculatedBbox[3]]
      );
      map.fitBounds(bounds, { padding: 20, animate: false });
    }
  }, [id, map, addSource, geoJson, fitGeoJsonBounds]);
};

export default GeoJsonSource;
