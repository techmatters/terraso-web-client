import React, { useMemo } from 'react';

import { Box } from '@mui/material';

import Map from 'gis/components/Map';
import {
  getLandscapeBoundingBox,
  isValidGeoJson,
} from 'landscape/landscapeUtils';

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
        style={{
          width: '100%',
          height: '400px',
        }}
      />
    </Box>
  );
};

export default LandscapeMap;
