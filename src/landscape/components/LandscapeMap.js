import React from 'react';
import _ from 'lodash/fp';
import { Box } from '@mui/material';

import Map from 'gis/components/Map';
import {
  getLandscapeBoundingBox,
  isValidGeoJson,
} from 'landscape/landscapeUtils';

const LandscapeMap = ({
  landscape,
  label,
  onPinLocationChange,
  enableSearch,
}) => {
  const bounds = getLandscapeBoundingBox(landscape);
  const areaPolygon = _.get('areaPolygon', landscape);
  const geojson = isValidGeoJson(areaPolygon) ? areaPolygon : null;
  return (
    <Box component="section" aria-label={label}>
      <Map
        bounds={bounds}
        geojson={geojson}
        onPinLocationChange={onPinLocationChange}
        enableSearch={enableSearch}
        style={{
          width: '100%',
          height: '400px',
        }}
      />
    </Box>
  );
};

export default LandscapeMap;
