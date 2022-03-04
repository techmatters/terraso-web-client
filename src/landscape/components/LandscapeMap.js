import React from 'react';
import _ from 'lodash/fp';
import { Box } from '@mui/material';

import Map from 'gis/components/Map';
import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';

const LandscapeMap = ({ landscape, label }) => {
  return (
    <Box component="section" aria-label={label}>
      <Map
        bounds={getLandscapeBoundingBox(landscape)}
        geojson={_.get('areaPolygon', landscape)}
        style={{
          width: '100%',
          height: '400px',
        }}
      />
    </Box>
  );
};

export default LandscapeMap;
