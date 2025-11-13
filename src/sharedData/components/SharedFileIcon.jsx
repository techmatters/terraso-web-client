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

import _ from 'lodash/fp';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Box } from '@mui/material';

const ICON_SIZE = 24;
const ICON_FILES = {
  csv: 'csv.png',
  doc: 'doc.png',
  docx: 'doc.png',
  pdf: 'pdf.png',
  ppt: 'ppt.png',
  pptx: 'ppt.png',
  xls: 'xls.png',
  xlsx: 'xls.png',
  kmz: 'kmz.png',
  kml: 'kml.png',
  gpx: 'gpx.png',
  geojson: 'json.png',
  json: 'json.png',
  zip: 'esri.png',
  jpg: 'jpg.png',
  jpeg: 'jpg.png',
  png: 'png.png',
};

const SharedFileIcon = ({ resourceType, styleProps, fallbackStyleProps }) => {
  if (_.includes(resourceType, Object.keys(ICON_FILES))) {
    return (
      <Box
        component="img"
        sx={{
          filter: 'opacity(50%)',
          width: 24,
          height: 24,
          ...styleProps,
        }}
        src={`/files/${ICON_FILES[resourceType]}`}
        alt={resourceType.toUpperCase()}
      />
    );
  }

  return (
    <InsertDriveFileOutlinedIcon
      sx={{
        fontSize: ICON_SIZE,
        color: 'gray.dark1',
        ...fallbackStyleProps,
      }}
    />
  );
};

export default SharedFileIcon;
