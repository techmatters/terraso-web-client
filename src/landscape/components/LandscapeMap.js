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
import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import Map from 'gis/components/Map';
import { isValidGeoJson } from 'gis/gisUtils';
import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';

const LandscapeMap = ({
  areaPolygon,
  boundingBox,
  label,
  onPinLocationChange,
  enableSearch,
  enableDraw,
  mapCenter,
  onGeoJsonChange,
  geoJsonFilter,
  drawOptions,
  defaultLayer,
}) => {
  const bounds = useMemo(
    () => getLandscapeBoundingBox({ areaPolygon, boundingBox }),
    [areaPolygon, boundingBox]
  );
  const geojson = isValidGeoJson(areaPolygon) ? areaPolygon : null;
  return (
    <Box component="section" aria-label={label}>
      <Map
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
      />
    </Box>
  );
};

export default LandscapeMap;
