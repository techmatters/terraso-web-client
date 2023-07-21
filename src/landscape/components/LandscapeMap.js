/*
 * Copyright © 2021-2023 Technology Matters
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
import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Box } from '@mui/material';
import GeoJsonSource from 'gis/components/GeoJsonSource';
import Layer from 'gis/components/Layer';
import MapboxGeocoder from 'gis/components/MapboxGeocoder';
import MapboxMap, { useMap } from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import MapboxMapStyleSwitcher from 'gis/components/MapboxMapStyleSwitcher';
import mapboxgl from 'gis/mapbox';
import { getMarkerImage } from 'gis/mapMarkers';
import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';
import theme from 'theme';
import logger from 'terraso-client-shared/monitoring/logger';

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
    try {
      map.fitBounds(new mapboxgl.LngLatBounds(bounds), {
        padding: 20,
        animate: false,
      });
    } catch (error) {
      logger.warn('Failed to fit map bounds', error);
    }
  }, [map, bounds]);
};

const Polygons = props => {
  const { geoJson } = props;

  const onlyPolygons = useMemo(
    () =>
      geoJson
        ? {
            ...geoJson,
            features: geoJson.features.filter(POLYGON_FILTER),
          }
        : null,
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
    () =>
      geoJson
        ? {
            ...geoJson,
            features: geoJson.features.filter(POINT_FILTER),
          }
        : null,
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

const LandscapeMap = props => {
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
        {showPolygons && areaPolygon && <Polygons geoJson={areaPolygon} />}
        {showMarkers && areaPolygon && <Markers geoJson={areaPolygon} />}
        {children}
      </MapboxMap>
    </Box>
  );
};

export default LandscapeMap;
