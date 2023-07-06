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
import React from 'react';
import { Box } from '@mui/material';
import DrawControls from 'gis/components/DrawControls';
import GeoJsonSource from 'gis/components/GeoJsonSource';
import Layer from 'gis/components/Layer';
// import Map from 'gis/components/Map';
import MapboxGeocoder from 'gis/components/MapboxGeocoder';
import MapboxMap from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import MapboxMapStyleSwitcher from 'gis/components/MapboxMapStyleSwitcher';
import { isValidGeoJson } from 'gis/gisUtils';
// import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';
import theme from 'theme';

const LandscapeMap = ({
  areaPolygon,
  boundingBox,
  label,
  // onPinLocationChange,
  // enableSearch,
  enableDraw,
  // mapCenter,
  onGeoJsonChange,
  // geoJsonFilter,
  drawOptions,
  // defaultLayer,
}) => {
  // const bounds = useMemo(
  //   () => getLandscapeBoundingBox({ areaPolygon, boundingBox }),
  //   [areaPolygon, boundingBox]
  // );
  const geojson = isValidGeoJson(areaPolygon) ? areaPolygon : null;
  return (
    <Box component="section" aria-label={label}>
      <MapboxMap
        projection="mercator"
        mapStyle="mapbox://styles/mapbox/streets-v12"
        sx={{
          width: '100%',
          height: '400px',
        }}
      >
        {enableDraw && <MapboxGeocoder position="top-left" />}
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
        {enableDraw && (
          <DrawControls onChange={onGeoJsonChange} drawOptions={drawOptions} />
        )}
      </MapboxMap>
      {/* <Map
        center={areaPolygon ? null : mapCenter}
        bounds={bounds}
        geojson={geojson}
        onPinLocationChange={onPinLocationChange}
        enableSearch={enableSearch}
        enableDraw={enableDraw}
        onGeoJsonChange={onGeoJsonChange}
        geoJsonFilter={geoJsonFilter}
        drawOptions={drawOptions}
        defaultLayer={defaultLayer}
        style={{
          width: '100%',
          height: '400px',
        }}
      /> */}
    </Box>
  );
};

export default LandscapeMap;
