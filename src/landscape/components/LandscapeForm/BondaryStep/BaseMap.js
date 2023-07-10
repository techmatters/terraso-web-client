import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Box } from '@mui/material';
import GeoJsonSource from 'gis/components/GeoJsonSource';
import Layer from 'gis/components/Layer';
import MapboxGeocoder from 'gis/components/MapboxGeocoder';
import MapboxMap, { useMap } from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import MapboxMapStyleSwitcher from 'gis/components/MapboxMapStyleSwitcher';
import { isValidGeoJson } from 'gis/gisUtils';
import mapboxgl from 'gis/mapbox';
import { getMarkerImage } from 'gis/mapMarkers';
import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';
import theme from 'theme';

export const POLYGON_FILTER = feature =>
  _.includes(_.get('geometry.type', feature), ['Polygon', 'MultiPolygon']);
export const POINT_FILTER = feature =>
  _.get('geometry.type', feature) === 'Point';

const BoundingBox = props => {
  const { map } = useMap();
  const [bounds] = useState(props.bounds);

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

const Polygons = props => {
  const { geoJson } = props;

  const onlyPolygons = useMemo(
    () => ({
      ...geoJson,
      features: geoJson.features.filter(POLYGON_FILTER),
    }),
    [geoJson]
  );

  return (
    <>
      <GeoJsonSource id="landscape-polygons" geoJson={onlyPolygons} />
      {!_.isEmpty(onlyPolygons?.features) && (
        <>
          <Layer
            id="area-polygon-fill"
            layer={{
              type: 'fill',
              source: 'landscape-polygons',
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
              source: 'landscape-polygons',
              layout: {},
              paint: {
                'line-color': theme.palette.map.polygon,
                'line-width': 3,
              },
            }}
          />
        </>
      )}
    </>
  );
};

const Markers = props => {
  const { geoJson } = props;
  const [image, setImage] = useState(null);

  const onlyPoints = useMemo(
    () => ({
      ...geoJson,
      features: geoJson.features.filter(POINT_FILTER),
    }),
    [geoJson]
  );

  useEffect(() => {
    getMarkerImage({ color: '#0055CC', size: 80 }).then(setImage);
  }, []);

  return (
    <>
      <GeoJsonSource id="landscape-markers" geoJson={onlyPoints} />
      {!_.isEmpty(onlyPoints?.features) && image && (
        <Layer
          id="area-polygon-markers"
          images={[{ name: 'marker-image', content: image }]}
          layer={{
            type: 'symbol',
            source: 'landscape-markers',
            layout: {
              'icon-image': 'marker-image',
              'icon-size': 0.5,
              'icon-offset': [0, -40],
            },
          }}
        />
      )}
    </>
  );
};

const BaseMap = props => {
  const {
    label,
    areaPolygon,
    children,
    showGeocoder,
    boundingBox,
    showPolygons,
    showMarkers,
    ...rest
  } = props;

  const geoJson = useMemo(
    () => (isValidGeoJson(areaPolygon) ? areaPolygon : null),
    [areaPolygon]
  );

  const bounds = useMemo(
    () => getLandscapeBoundingBox({ boundingBox, areaPolygon }),
    [boundingBox, areaPolygon]
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
        <BoundingBox bounds={bounds} />
        {showGeocoder && <MapboxGeocoder position="top-left" />}
        <MapboxMapControls />
        <MapboxMapStyleSwitcher />
        {showPolygons && geoJson && <Polygons geoJson={geoJson} />}
        {showMarkers && geoJson && <Markers geoJson={geoJson} />}
        {children}
      </MapboxMap>
    </Box>
  );
};

export default BaseMap;
