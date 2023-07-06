import React, { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import GeoJsonSource from 'gis/components/GeoJsonSource';
import Layer from 'gis/components/Layer';
import MapboxGeocoder from 'gis/components/MapboxGeocoder';
import MapboxMap, { useMap } from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import MapboxMapStyleSwitcher from 'gis/components/MapboxMapStyleSwitcher';
import { isValidGeoJson } from 'gis/gisUtils';
import mapboxgl from 'gis/mapbox';
import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';
import theme from 'theme';

const BoundingBox = props => {
  const { boundingBox, areaPolygon } = props;
  const { map } = useMap();

  const bounds = useMemo(
    () => getLandscapeBoundingBox({ areaPolygon, boundingBox }),
    [areaPolygon, boundingBox]
  );

  useEffect(() => {
    if (!map || !bounds) {
      return;
    }

    map.fitBounds(new mapboxgl.LngLatBounds(bounds), {
      padding: 20,
      animate: false,
    });
  }, [map, bounds]);
};

const BaseMap = props => {
  const { label, areaPolygon, children, showGeocoder, boundingBox, ...rest } =
    props;
  const geojson = useMemo(
    () => (isValidGeoJson(areaPolygon) ? areaPolygon : null),
    [areaPolygon]
  );

  return (
    <Box component="section" aria-label={label}>
      <MapboxMap
        projection="mercator"
        mapStyle="mapbox://styles/mapbox/streets-v12"
        sx={{
          width: '100%',
          height: '400px',
        }}
        {...rest}
      >
        <BoundingBox boundingBox={boundingBox} areaPolygon={areaPolygon} />
        {showGeocoder && <MapboxGeocoder position="top-left" />}
        <MapboxMapControls />
        <MapboxMapStyleSwitcher />
        <GeoJsonSource fitGeoJsonBounds id="area-polygon" geoJson={geojson} />
        {geojson && (
          <>
            <Layer
              id="area-polygon-fill"
              layer={{
                type: 'fill',
                source: 'area-polygon',
                paint: {
                  'fill-color': theme.palette.map.polygonFill,
                  'fill-opacity': 0.5,
                },
              }}
            />
            <Layer
              id="area-polygon-outline"
              layer={{
                type: 'line',
                source: 'area-polygon',
                layout: {},
                paint: {
                  'line-color': theme.palette.map.polygon,
                  'line-width': 3,
                },
              }}
            />
          </>
        )}
        {children}
      </MapboxMap>
    </Box>
  );
};

export default BaseMap;
